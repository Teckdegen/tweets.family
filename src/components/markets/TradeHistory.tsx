import type { BookTrade } from "@/data/markets";
import { formatUsdg, quoteTrade, riskFeeRate } from "@/lib/quote";

const BASE_FEE = riskFeeRate(0);

function when(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

const statusStyle = {
  open: "bg-[#fff6df] text-[#8a6408]",
  won: "bg-[#e7f8ee] text-[#157a45]",
  lost: "bg-[#fdecee] text-[#b4233a]",
} as const;

export default function TradeHistory({ trades }: { trades: BookTrade[] }) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04]">
      <div className="flex items-end justify-between gap-3 px-5 pt-5 pb-3">
        <div>
          <h2 className="text-[16px] font-semibold tracking-[-0.02em]">Trade history</h2>
          <p className="mt-1 text-[13px] text-white/50">
            Sample book at the 5% house fee. Trades you open use the fee on the ticket.
          </p>
        </div>
      </div>
      <div>
        <table className="w-full table-fixed text-left text-[12px] sm:text-[13px]">
          <thead className="text-[11px] font-semibold tracking-[0.08em] text-white/40 uppercase">
            <tr className="border-y border-white/10">
              <th className="px-5 py-2.5 font-semibold">Opened</th>
              <th className="px-3 py-2.5 font-semibold">Collateral</th>
              <th className="px-3 py-2.5 font-semibold">Line</th>
              <th className="px-3 py-2.5 font-semibold">Clock</th>
              <th className="px-3 py-2.5 font-semibold">Target</th>
              <th className="px-3 py-2.5 font-semibold">Status</th>
              <th className="px-5 py-2.5 text-right font-semibold">Payout</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => {
              const quote = quoteTrade(trade.amount, trade.minutes, trade.line, trade.feeRate ?? BASE_FEE);
              const payout = trade.status === "lost" ? null : quote.back;
              return (
                <tr key={trade.id} className="border-b border-white/10 last:border-0">
                  <td className="px-5 py-3 text-white/55">{when(trade.openedAt)}</td>
                  <td className="px-3 py-3 font-medium tabular-nums">{formatUsdg(trade.amount)}</td>
                  <td className="px-3 py-3 tabular-nums">{trade.line}x</td>
                  <td className="px-3 py-3 tabular-nums">{trade.minutes}m</td>
                  <td className="px-3 py-3 tabular-nums">{(trade.entry * trade.line).toLocaleString("en-US")}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[12px] font-semibold capitalize ${statusStyle[trade.status]}`}>
                      {trade.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums">
                    {payout == null ? "—" : `${formatUsdg(payout)} USDG`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
