import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ListingDetail } from '@/catalogue/types';

/**
 * AuthenticityCard Component
 *
 * Shows the verification status, authenticity evidence and digital certificate
 * of a verified listing. The certificate can be printed or saved as PDF from the browser.
 */

interface AuthenticityCardProps {
  listing: ListingDetail;
}

export function AuthenticityCard({ listing }: AuthenticityCardProps) {
  return (
    <Card className="mt-8 max-w-[760px]">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-[clamp(1.2rem,1.7vw,2rem)] font-extrabold tracking-[-0.03em]">Authenticity</CardTitle>
          <Badge className="h-auto rounded-full border-0 bg-online px-4 py-1.5 text-sm font-bold text-white">
            Verified{listing.verifiedAt ? ` ${new Date(listing.verifiedAt).toLocaleDateString('en-GB')}` : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {listing.authenticityNotes && <p className="m-0 font-medium text-slate">{listing.authenticityNotes}</p>}
        {listing.evidenceImages.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {listing.evidenceImages.map((src) => (
              <img key={src} className="h-24 rounded-[10px] object-cover" src={src} alt="Authenticity evidence" />
            ))}
          </div>
        )}
        {listing.certificateCode && (
          <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
            <div>
              <div className="text-sm font-bold text-slate uppercase">Certificate of authenticity</div>
              <div className="text-xl font-extrabold">{listing.certificateCode}</div>
            </div>
            <Button className="h-auto rounded-full px-5 py-2 font-bold" onClick={() => window.print()}>
              PRINT
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}