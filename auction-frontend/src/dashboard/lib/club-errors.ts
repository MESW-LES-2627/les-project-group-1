import axios from "axios"
import { getErrorMessage } from "@/lib/http"

/** The club API answers with short codes like { error: "title_taken" }. This turns them into text for the user. */
const MESSAGES: Record<string, string> = {
  title_taken: "A listing with this title already exists. Choose another title.",
  unknown_category: "Select a valid category.",
  listing_locked: "This listing can't be changed anymore.",
  not_found: "This listing no longer exists.",
  club_not_approved: "Your club has not been approved yet.",
  no_club: "Your account has no club.",
  invalid_category: "Select a category.",
  invalid_title: "The title must be 3 to 120 characters.",
  invalid_description: "The description must be 10 to 2000 characters.",
  invalid_player_name: "The player name can have up to 80 characters.",
  invalid_season: "The season can have up to 20 characters.",
  invalid_competition: "The competition can have up to 100 characters.",
  invalid_match: "The match can have up to 100 characters.",
  invalid_authenticity_notes: "The authenticity notes can have up to 1000 characters.",
  invalid_player_details: "Check the player details.",
  invalid_tags: "Use up to 10 tags, each with up to 30 characters.",
  invalid_starting_price: "The starting price must be between 0.01 and 1,000,000.",
  invalid_auction_ends_at: "The auction end must be a date in the future.",
  invalid_auction_starts_at: "The auction start must be a date in the future.",
  auction_starts_after_end: "The auction must start before it ends.",
  listing_cancelled: "This listing was cancelled, so it can't be changed anymore.",
  already_cancelled: "This auction was already cancelled.",
  only_auction_settings: "The item was already verified: only the starting price, the dates and the charity can change.",
  auction_start_required: "A verified auction needs a start date.",
  not_verified: "Only an approved auction can be cancelled. A listing that isn't approved yet can be deleted instead.",
  auction_already_open: "The auction has already opened. Only an administrator can cancel it now.",
  invalid_status: "That status can't be set by a club.",
  invalid_image: "Images must be PNG, JPEG or WebP files.",
  too_many_images: "You can have up to 10 images in each section.",
  invalid_remove_images: "One of the images to remove doesn't belong to this listing.",
  file_too_large: "Each image can be at most 2 MB.",
  too_many_or_unexpected_files: "Too many files in one upload.",
  upload_error: "The upload failed. Try again.",
  no_fields: "There is nothing to save.",
  invalid_body: "The request was not valid.",
  invalid_id: "This listing is not valid.",
}

const MISSING_LABELS: Record<string, string> = {
  startingPrice: "a starting price",
  auctionEndsAt: "an auction end date in the future",
  images: "at least one photo",
}

export function getClubErrorMessage(error: unknown, fallback = "Something went wrong. Try again.") {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: unknown; missing?: unknown } | undefined
    const code = data?.error

    if (code === "incomplete_listing" && Array.isArray(data?.missing)) {
      const parts = data.missing.map((m) => MISSING_LABELS[String(m)] ?? String(m))
      return `To submit for verification, add ${parts.join(", ")}.`
    }
    if (typeof code === "string" && MESSAGES[code]) return MESSAGES[code]
    if (typeof code === "string" && code.includes(" ")) return code // already a sentence from the API
  }
  return getErrorMessage(error, fallback)
}
