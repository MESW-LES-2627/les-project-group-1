import { LATEST_BIDS_SHOWN } from '../auction/data';
import type { Bid } from '../auction/types';
import { flagEmoji, formatDate, formatEuroSuffix, shortId } from '../auction/utils';

interface LatestBidsProps {
  bids: Bid[];
  myId: string;
}

export function LatestBids({ bids, myId }: LatestBidsProps) {
  return (
    <div className="max-w-[640px] overflow-hidden rounded-[14px] bg-card shadow-[0_6px_24px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between bg-[#dcdcdc] px-7 py-4">
        <h3 className="m-0 text-[1.4rem] font-extrabold">LATEST BIDS</h3>
        <a className="text-[1.2rem] font-extrabold text-link" href="#all-bids">VIEW ALL</a>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="px-5 pt-[14px] pb-2 text-center text-[15px] font-bold text-[#555]">BIDDER</th>
            <th className="px-5 pt-[14px] pb-2 text-center text-[15px] font-bold text-[#555]">DATE</th>
            <th className="px-5 pt-[14px] pb-2 text-center text-[15px] font-bold text-[#555]">BID</th>
          </tr>
        </thead>
        <tbody>
          {bids.length === 0 ? (
            <tr>
              <td colSpan={3} className="border-t-2 border-[#e8e8e8] px-5 py-[14px] text-center text-[15px] font-extrabold text-muted">
                No bids yet
              </td>
            </tr>
          ) : (
            bids.slice(0, LATEST_BIDS_SHOWN).map((bid, index) => (
              <tr key={`${bid.timestamp}-${index}`}>
                <td className="border-t-2 border-[#e8e8e8] px-5 py-[14px] text-center text-[15px] font-extrabold first:text-left">
                  <span className="mr-[18px] text-2xl">{flagEmoji(bid.country)}</span>
                  {shortId(bid.bidder)}
                  {bid.bidder === myId && (
                    <span className="ml-2.5 rounded-full bg-purple px-2 py-0.5 text-xs font-extrabold text-white uppercase">
                      you
                    </span>
                  )}
                </td>
                <td className="border-t-2 border-[#e8e8e8] px-5 py-[14px] text-center text-[15px] font-extrabold">{formatDate(bid.timestamp)}</td>
                <td className="border-t-2 border-[#e8e8e8] px-5 py-[14px] text-center text-[15px] font-extrabold">{formatEuroSuffix(bid.amount)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
