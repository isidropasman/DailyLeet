"use client";

import { useEffect, useState } from "react";

export interface LeaderboardRankingItem {
  userId: string;
  userName: string;
  rank: number;
  value: number;
  elapsed: number;
}

export function LeaderboardRankings({ rankings, currentUserId, pageSize = 10 }: { rankings: LeaderboardRankingItem[]; currentUserId?: string; pageSize?: number }) {
  const [page, setPage] = useState(0);
  useEffect(() => { setPage(0); }, [rankings]);
  const pages = Math.ceil(rankings.length / pageSize);
  const time = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
  return <><table className="ranking-table" aria-label="Posiciones del ranking"><thead><tr><th>Posición</th><th>Jugador</th><th>Puntos</th><th>Tiempo</th></tr></thead><tbody>{rankings.slice(page * pageSize, (page + 1) * pageSize).map(entry => <tr className={entry.userId === currentUserId ? "me" : ""} key={entry.userId}><td>{entry.rank}</td><td>{entry.userName}{entry.userId === currentUserId && <small> vos</small>}</td><td><strong>{entry.value}</strong></td><td>{time(entry.elapsed)}</td></tr>)}</tbody></table>{pages > 1 && <div className="ranking-pagination"><button className="text-button" disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</button><span>{page + 1} / {pages}</span><button className="text-button" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Siguiente</button></div>}</>;
}
