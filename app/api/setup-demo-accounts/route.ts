import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

// Demo account data
const DEMO_ACCOUNTS = [
  {
    phone: "1234567890",
    email: "admin@retailbandhu.com",
    role: "admin",
    name: "Admin User",
    businessName: "RetailBandhu Admin",
    pinCode: "110001",
    isApproved: true,
  },
  {
    phone: "9876543210",
    email: "retailer@retailbandhu.com",
    role: "retailer",
    name: "Demo Retailer",
    businessName: "Demo Retail Store",
    pinCode: "400001",
    isApproved: true,
  },
  {
    phone: "9876543211",
    email: "wholesaler@retailbandhu.com",
    role: "wholesaler",
    name: "Demo Wholesaler",
    businessName: "Demo Wholesale Business",
    pinCode: "600001",
    isApproved: true,
  },
  {
    phone: "9876543212",
    email: "delivery@retailbandhu.com",
    role: "delivery",
    name: "Demo Delivery",
    businessName: "Demo Delivery Service",
    pinCode: "500001",
    isApproved: true,
    vehicleType: "bike",
  },
]

export async function GET() {
  try {
    console.log("Setting up demo accounts...")
    const results = []

    for (const account of DEMO_ACCOUNTS) {
      try {
        console.log(`Processing demo account for ${account.role}...`)

        // Check if user exists by phone number in the users table
        let existingUserId = null

        // Check by phone number in users table
        if (account.phone) {
          try {
            const { data: userByPhone, error: phoneError } = await supabaseAdmin
              .from("users")
              .select("id")
              .eq("phone_number", `+91${account.phone}`)
              .maybeSingle()

            if (phoneError) {
              console.error(`Error checking user by phone:`, phoneError)
            } else if (userByPhone) {
              existingUserId = userByPhone.id
              console.log(`Found existing user with phone ${account.phone}: ${existingUserId}`)
            }
          } catch (phoneCheckError) {
            console.error(`Error checking user by phone:`, phoneCheckError)
          }
        }

        // If user doesn't exist, create it
        if (!existingUserId) {
          console.log(`Creating new user for ${account.role}...`)

          try {
            // Create auth user
            const createOptions = {
              email: account.email,
              phone: `+91${account.phone}`,
              email_confirm: true,
              phone_confirm: true,
              user_metadata: {
                role: account.role,
                name: account.name,
              },
            }

            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser(createOptions)

            if (authError) {
              console.error(`Error creating auth user for ${account.role}:`, authError)
              results.push({
                account: `${account.role} (${account.phone})`,
                status: "error",
                message: authError.message,
              })
              continue
            }

            if (!authData.user) {
              console.error(`Failed to create auth user for ${account.role}`)
              results.push({
                account: `${account.role} (${account.phone})`,
                status: "error",
                message: "Failed to create user",
              })
              continue
            }

            existingUserId = authData.user.id
            console.log(`Created new auth user with ID: ${existingUserId}`)
          } catch (createError) {
            console.error(`Error creating auth user:`, createError)
            results.push({
              account: `${account.role} (${account.phone})`,
              status: "error",
              message: "Error creating user",
            })
            continue
          }
        }

        // Now create or update the user profile
        if (existingUserId) {
          // Check if profile exists
          const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("id", existingUserId)
            .maybeSingle()

          if (profileCheckError && profileCheckError.code !== "PGRST116") {
            console.error(`Error checking profile:`, profileCheckError)
            results.push({
              account: `${account.role} (${account.phone})`,
              status: "error",
              message: profileCheckError.message,
            })
            continue
          }

          if (existingProfile) {
            // Update existing profile
            console.log(`Updating existing profile for ${account.role}...`)

            const { error: updateError } = await supabaseAdmin
              .from("users")
              .update({
                role: account.role,
                name: account.name,
                business_name: account.businessName,
                pin_code: account.pinCode,
                is_approved: account.isApproved,
                phone_number: `+91${account.phone}`,
                ...(account.vehicleType ? { vehicle_type: account.vehicleType } : {}),
              })
              .eq("id", existingUserId)

            if (updateError) {
              console.error(`Error updating profile:`, updateError)
              results.push({
                account: `${account.role} (${account.phone})`,
                status: "error",
                message: updateError.message,
              })
              continue
            }

            results.push({
              account: `${account.role} (${account.phone})`,
              status: "updated",
            })
          } else {
            // Create new profile
            console.log(`Creating new profile for ${account.role}...`)

            const userData = {
              id: existingUserId,
              phone_number: `+91${account.phone}`,
              role: account.role,
              name: account.name,
              business_name: account.businessName,
              pin_code: account.pinCode,
              is_approved: account.isApproved,
            }

            // Add vehicle_type only for delivery accounts
            if (account.role === "delivery" && account.vehicleType) {
              userData["vehicle_type"] = account.vehicleType
            }

            const { error: insertError } = await supabaseAdmin.from("users").insert(userData)

            if (insertError) {
              console.error(`Error creating profile:`, insertError)
              results.push({
                account: `${account.role} (${account.phone})`,
                status: "error",
                message: insertError.message,
              })
              continue
            }

            results.push({
              account: `${account.role} (${account.phone})`,
              status: "created",
            })
          }

          console.log(`Successfully processed ${account.role} account`)
        }
      } catch (accountError) {
        console.error(`Unexpected error processing ${account.role} account:`, accountError)
        results.push({
          account: `${account.role} (${account.phone})`,
          status: "error",
          message: "Unexpected error",
        })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error("Error setting up demo accounts:", error)
    return NextResponse.json({ success: false, error: "Failed to set up demo accounts" }, { status: 500 })
  }
}
