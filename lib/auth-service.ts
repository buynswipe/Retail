import { supabase, supabaseAdmin, type UserRole } from "./supabase"
import { isDemoAccount, getDemoAccount } from "./demo-auth"

// Send OTP via Supabase Auth (Phone or Email)
export async function sendOtp(identifier: string): Promise<{ success: boolean; error?: string }> {
  try {
    const isEmail = identifier.includes("@")
    console.log(`Sending OTP to ${identifier} via ${isEmail ? "email" : "phone"}`)

    // Check if this is a demo account
    if (isDemoAccount(identifier)) {
      console.log("Using demo account authentication")
      return { success: true }
    }

    // For debugging
    if (!isEmail) {
      // Ensure phone number is in E.164 format (+91XXXXXXXXXX)
      // First, strip any existing formatting
      const digits = identifier.replace(/\D/g, "")

      // Check if we have a valid 10-digit number
      if (digits.length !== 10) {
        return {
          success: false,
          error: "Phone number must be exactly 10 digits",
        }
      }

      // Format with country code
      const formattedPhone = `+91${digits}`
      console.log("Formatted phone:", formattedPhone)

      // Use Supabase Auth to send OTP
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          shouldCreateUser: true,
        },
      })

      if (error) {
        console.error("Error sending OTP:", error)

        // If we get an unsupported phone provider error, suggest using a demo account
        if (error.message.includes("unsupported phone provider")) {
          return {
            success: false,
            error: "SMS delivery is not available in development mode. Please use a demo account.",
          }
        }

        return { success: false, error: error.message }
      }
    } else {
      // Handle email OTP
      const { error } = await supabase.auth.signInWithOtp({
        email: identifier,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
        },
      })

      if (error) {
        console.error("Error sending OTP:", error)
        return { success: false, error: error.message }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error sending OTP:", error)
    return { success: false, error: "Failed to send OTP. Please try again." }
  }
}

// Verify OTP and sign in (Phone or Email)
export async function verifyOtp(
  identifier: string,
  otp: string,
): Promise<{ success: boolean; userData?: any; error?: string }> {
  try {
    // Check if this is a demo account
    if (isDemoAccount(identifier)) {
      console.log("Using demo account authentication")
      const demoAccount = getDemoAccount(identifier)

      if (!demoAccount) {
        return { success: false, error: "Demo account not found" }
      }

      // For demo accounts, any 6-digit OTP is valid
      if (!/^\d{6}$/.test(otp)) {
        return { success: false, error: "Invalid OTP format. Please enter 6 digits." }
      }

      // Return demo user data
      return {
        success: true,
        userData: {
          id: `demo-${demoAccount.role}`,
          phone: demoAccount.phone,
          email: demoAccount.email,
          role: demoAccount.role,
          name: demoAccount.name,
          businessName: demoAccount.businessName,
          pinCode: demoAccount.pinCode,
          isApproved: demoAccount.isApproved,
        },
      }
    }

    const isEmail = identifier.includes("@")

    // Format phone number correctly
    let formattedIdentifier = identifier
    if (!isEmail) {
      // Remove any existing country code or extra digits
      const cleanNumber = identifier.replace(/\D/g, "")
      formattedIdentifier = `+91${cleanNumber}`
    }

    console.log("Verifying with identifier:", formattedIdentifier)

    // Use Supabase Auth to verify OTP
    const { data: authData, error } = await supabase.auth.verifyOtp({
      phone: isEmail ? undefined : formattedIdentifier,
      email: isEmail ? formattedIdentifier : undefined,
      token: otp,
      type: isEmail ? "email" : "sms",
    })

    if (error) {
      console.error("Error verifying OTP:", error)
      return { success: false, error: error.message }
    }

    if (!authData.user) {
      return { success: false, error: "Failed to authenticate user." }
    }

    try {
      // Use the admin client to get user profile data to bypass RLS
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single()

      if (profileError) {
        console.error("Error fetching user profile:", profileError)

        // If user doesn't exist in the users table, create a new profile
        if (profileError.code === "PGRST116") {
          try {
            // Create a new user profile using the admin client
            const { data: newProfile, error: createError } = await supabaseAdmin
              .from("users")
              .insert({
                id: authData.user.id,
                phone_number: isEmail ? null : formattedIdentifier,
                role: "retailer", // Default role
                is_approved: true, // Auto-approve
                name: "", // Add empty string defaults for required fields
                business_name: "",
                pin_code: "",
              })
              .select()
              .single()

            if (createError) {
              console.error("Error creating user profile:", createError)
              return { success: false, error: "Failed to create user profile: " + createError.message }
            }

            return {
              success: true,
              userData: {
                id: authData.user.id,
                phone: newProfile.phone_number,
                role: newProfile.role,
                isApproved: newProfile.is_approved,
              },
            }
          } catch (err) {
            console.error("Exception creating user profile:", err)
            return { success: false, error: "Exception creating user profile" }
          }
        }

        return { success: false, error: "Failed to fetch user profile: " + profileError.message }
      }

      return {
        success: true,
        userData: {
          id: profileData.id,
          phone: profileData.phone_number,
          role: profileData.role,
          name: profileData.name,
          businessName: profileData.business_name,
          pinCode: profileData.pin_code,
          isApproved: profileData.is_approved,
        },
      }
    } catch (err) {
      console.error("Exception in profile handling:", err)
      return { success: false, error: "An error occurred while processing your profile" }
    }
  } catch (error) {
    console.error("Error verifying OTP:", error)
    return { success: false, error: "Failed to verify OTP. Please try again." }
  }
}

// Sign up a new user
export async function signUp(data: {
  phone?: string
  email?: string
  role: UserRole
  name?: string
  businessName?: string
  pinCode?: string
  gstNumber?: string
  bankAccountNumber?: string
  bankIfsc?: string
  vehicleType?: "bike" | "van"
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if phone number or email is provided
    if (!data.phone && !data.email) {
      return { success: false, error: "Phone number or email is required." }
    }

    // Format phone number correctly
    let formattedPhone = undefined
    if (data.phone) {
      // Clean the phone number to just digits
      const digits = data.phone.replace(/\D/g, "")
      formattedPhone = `+91${digits}`
      console.log("Formatted phone for signup:", formattedPhone)
    }

    try {
      // Check if user already exists
      if (formattedPhone) {
        const { data: phoneUser, error: phoneError } = await supabaseAdmin
          .from("users")
          .select("phone_number")
          .eq("phone_number", formattedPhone)
          .maybeSingle()

        if (phoneError && phoneError.code !== "PGRST116") {
          console.error("Error checking user by phone:", phoneError)
          return { success: false, error: "Failed to check if user exists." }
        }

        if (phoneUser) {
          return { success: false, error: "User with this phone number already exists." }
        }
      } else if (data.email) {
        const { data: emailUser, error: emailError } = await supabaseAdmin
          .from("users")
          .select("email")
          .eq("email", data.email)
          .maybeSingle()

        if (emailError && emailError.code !== "PGRST116") {
          console.error("Error checking user by email:", emailError)
          return { success: false, error: "Failed to check if user exists." }
        }

        if (emailUser) {
          return { success: false, error: "User with this email already exists." }
        }
      }

      // First, create the auth user with phone or email authentication
      let authData
      let authError

      if (formattedPhone) {
        console.log("Creating user with phone:", formattedPhone)
        const authResult = await supabaseAdmin.auth.admin.createUser({
          phone: formattedPhone,
          phone_confirm: true, // Auto-confirm for simplicity
        })
        authData = authResult.data
        authError = authResult.error
      } else if (data.email) {
        console.log("Creating user with email:", data.email)
        const authResult = await supabaseAdmin.auth.admin.createUser({
          email: data.email,
          email_confirm: true, // Auto-confirm for simplicity
        })
        authData = authResult.data
        authError = authResult.error
      }

      if (authError) {
        console.error("Error creating auth user:", authError)
        return { success: false, error: authError.message }
      }

      if (!authData.user) {
        return { success: false, error: "Failed to create user." }
      }

      // Then, create the user profile using the admin client to bypass RLS
      const { error: profileError } = await supabaseAdmin.from("users").insert({
        id: authData.user.id,
        phone_number: formattedPhone,
        role: data.role,
        name: data.name || "",
        business_name: data.businessName || "",
        pin_code: data.pinCode || "",
        gst_number: data.gstNumber || "",
        bank_account_number: data.bankAccountNumber || "",
        bank_ifsc: data.bankIfsc || "",
        vehicle_type: data.vehicleType || null,
        is_approved: data.role === "retailer", // Auto-approve retailers
      })

      if (profileError) {
        console.error("Error creating user profile:", profileError)
        return { success: false, error: "Failed to create user profile: " + profileError.message }
      }

      return { success: true }
    } catch (err) {
      console.error("Exception in user creation:", err)
      return { success: false, error: "An error occurred during signup" }
    }
  } catch (error) {
    console.error("Error signing up:", error)
    return { success: false, error: "Failed to sign up. Please try again." }
  }
}

// Other auth functions remain the same...
