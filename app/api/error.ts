import { NextResponse } from "next/server"

export function handleApiError(error: unknown) {
  console.error("API Error:", error)

  const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"

  return NextResponse.json(
    {
      error: errorMessage,
      success: false,
    },
    {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    },
  )
}

export default handleApiError
