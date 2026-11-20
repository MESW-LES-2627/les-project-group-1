import type { ReactNode } from "react"
import { ExternalLink } from "lucide-react"
import { assetUrl } from "@/lib/assets"
import { useMyListing } from "@/dashboard/hooks/use-my-listings"
import { getClubErrorMessage } from "@/dashboard/lib/club-errors"
import type { MyListing } from "@/dashboard/lib/club-api"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/dashboard/components/ui/dialog"
import { ListingStatusBadge } from "@/dashboard/components/dashboard/listing-status-badge"
import { AuctionStatusBadge } from "@/dashboard/components/dashboard/auction-status-badge"

const euro = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" })
const dateTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : "—")

interface Props {
  listing: MyListing | null // set = open
  onOpenChange: (open: boolean) => void
}

/**
 * Read-only view of one of the club's auctions: the item, the auction settings and how the auction is
 * going (bids so far). The details are loaded again when it opens, so the bids are up to date.
 */
export function MyListingDetailsDialog({ listing, onOpenChange }: Props) {
  const details = useMyListing(listing?.id ?? null)
  const shown = details.data ?? listing

  return (
    <Dialog open={listing !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{shown?.title}</DialogTitle>
          <DialogDescription>{shown?.category.name}</DialogDescription>
        </DialogHeader>

        {shown && (
          <div className="space-y-5 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <ListingStatusBadge status={shown.status} />
              <AuctionStatusBadge status={shown.auctionStatus} />
            </div>

            <section>
              <h3 className="mb-2 font-medium">Auction</h3>
              <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                <Item label="Starting price">
                  {shown.startingPrice === null ? "—" : euro.format(shown.startingPrice)}
                </Item>
                <Item label="Highest bid">
                  {details.isPending
                    ? "Loading…"
                    : details.data?.highestBid != null
                      ? euro.format(details.data.highestBid)
                      : "No bids yet"}
                </Item>
                <Item label="Bids">{details.data ? details.data.bidCount : "—"}</Item>
                <Item label="Starts">{shown.auctionStartsAt ? dateTime(shown.auctionStartsAt) : "When verified"}</Item>
                <Item label="Ends">{dateTime(shown.auctionEndsAt)}</Item>
                {shown.cancelledAt && <Item label="Cancelled">{dateTime(shown.cancelledAt)}</Item>}
                <Item label="Charity">
                  {shown.charitableOrganization
                    ? `${shown.charitableOrganization.name}${
                        shown.donationPercentage !== null ? ` · ${shown.donationPercentage}%` : ""
                      }`
                    : "None"}
                </Item>
              </dl>
              {details.isError && (
                <p role="alert" className="mt-2 text-destructive">
                  {getClubErrorMessage(details.error, "Couldn’t load the bids.")}
                </p>
              )}
            </section>

            <section>
              <h3 className="mb-2 font-medium">Item</h3>
              <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {shown.playerName && <Item label="Player">{shown.playerName}</Item>}
                {shown.season && <Item label="Season">{shown.season}</Item>}
                {shown.competition && <Item label="Competition">{shown.competition}</Item>}
                {shown.match && <Item label="Match">{shown.match}</Item>}
                {shown.tags.length > 0 && <Item label="Tags">{shown.tags.join(", ")}</Item>}
              </dl>
              <p className="mt-3 whitespace-pre-line">{shown.description}</p>
            </section>

            {shown.images.length > 0 && (
              <section>
                <h3 className="mb-2 font-medium">Photos</h3>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {shown.images.map((image) => (
                    <img key={image} src={assetUrl(image)} alt="" className="aspect-square rounded-md border object-cover" />
                  ))}
                </div>
              </section>
            )}

            {shown.authenticityNotes && (
              <section>
                <h3 className="mb-2 font-medium">Authenticity notes</h3>
                <p className="whitespace-pre-line">{shown.authenticityNotes}</p>
              </section>
            )}

            {shown.status === "verified" && (
              <Button asChild variant="outline" size="sm">
                <a href={`/auction/${shown.id}`} target="_blank" rel="noreferrer">
                  <ExternalLink /> Open the auction page
                </a>
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}
