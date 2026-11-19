import { assetUrl } from "@/lib/assets"
import type { AdminListing } from "@/dashboard/lib/api"
import { ListingStatusBadge } from "@/dashboard/components/dashboard/listing-status-badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/dashboard/components/ui/dialog"

interface Props {
    listing: AdminListing | null
    onClose: () => void
}

export function AdminListingDetailsDialog({ listing, onClose }: Props) {
    if (!listing) return null

    const euro = new Intl.NumberFormat("en-IE", {
        style: "currency",
        currency: "EUR",
    })

    return (
        <Dialog open={!!listing} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{listing.title}</DialogTitle>
                    <DialogDescription>
                        Listing details and verification information
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    {/* Images */}
                    {listing.images?.length > 0 && (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {listing.images.map((image, index) => (
                                <img
                                    key={image}
                                    src={assetUrl(image)}
                                    alt={`${listing.title} ${index + 1}`}
                                    className="aspect-square w-full rounded-lg border object-cover"
                                />
                            ))}
                        </div>
                    )}

                    {/* Main information */}
                    <section className="grid grid-cols-2 gap-4 text-sm">
                        <Detail label="Category" value={listing.category?.name} />
                        <div>
                            <p className="text-muted-foreground">Status</p>
                            <ListingStatusBadge status={listing.status} />
                        </div>
                        <Detail label="Player" value={listing.playerName} />
                        <Detail label="Season" value={listing.season} />
                        <Detail label="Competition" value={listing.competition} />
                        <Detail label="Match" value={listing.match} />
                        <Detail
                            label="Starting price"
                            value={
                                listing.startingPrice == null
                                    ? "—"
                                    : euro.format(listing.startingPrice)
                            }
                        />
                        <Detail
                            label="Created"
                            value={new Date(listing.createdAt).toLocaleString()}
                        />
                        <Detail
                            label="Auction ends"
                            value={
                                listing.auctionEndsAt
                                    ? new Date(listing.auctionEndsAt).toLocaleString()
                                    : "—"
                            }
                        />
                        <Detail
                            label="Verified at"
                            value={
                                listing.verifiedAt
                                    ? new Date(listing.verifiedAt).toLocaleString()
                                    : "—"
                            }
                        />
                    </section>

                    <section>
                        <h3 className="mb-2 font-medium">Description</h3>
                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                            {listing.description || "No description provided."}
                        </p>
                    </section>

                    {listing.tags?.length > 0 && (
                        <section>
                            <h3 className="mb-2 font-medium">Tags</h3>
                            <div className="flex flex-wrap gap-2">
                                {listing.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-full bg-muted px-3 py-1 text-xs"
                                    >
                    {tag}
                  </span>
                                ))}
                            </div>
                        </section>
                    )}

                    <section>
                        <h3 className="mb-2 font-medium">Authenticity notes</h3>
                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                            {listing.authenticityNotes || "No authenticity notes provided."}
                        </p>
                    </section>

                    {listing.evidenceImages?.length > 0 && (
                        <section>
                            <h3 className="mb-2 font-medium">Evidence images</h3>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {listing.evidenceImages.map((image, index) => (
                                    <img
                                        key={image}
                                        src={assetUrl(image)}
                                        alt={`Evidence ${index + 1}`}
                                        className="aspect-square w-full rounded-lg border object-cover"
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    <Detail label="Certificate code" value={listing.certificateCode} />
                </div>
            </DialogContent>
        </Dialog>
    )
}

function Detail({ label, value }: { label: string; value?: string | null }) {
    return (
        <div>
            <p className="text-muted-foreground">{label}</p>
            <p className="mt-1 font-medium">{value || "—"}</p>
        </div>
    )
}