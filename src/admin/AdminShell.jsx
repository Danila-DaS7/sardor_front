import { useMemo } from "react";
import { useConvexQuery } from "../hooks/useConvexQuery.js";
import {
  getTelegramAuthPayload,
  isTelegramBypassEnabled,
} from "../lib/telegram.js";
import TabBar from "./ui/TabBar.jsx";

export default function AdminShell({ children }) {
  const authData = getTelegramAuthPayload();
  const bypass = isTelegramBypassEnabled();

  const qArgs = useMemo(() => {
    if (!authData && !bypass) return null;
    return { authData: authData || "" };
  }, [authData, bypass]);

  const { data: requests } = useConvexQuery("requests:listRequests", qArgs);
  const { data: totalUnread } = useConvexQuery("messages:totalUnread", qArgs);

  const newCount = useMemo(() => {
    if (!Array.isArray(requests)) return 0;
    return requests.filter((r) => !r.status || r.status === "new").length;
  }, [requests]);

  const dialogsBadge = newCount + (totalUnread || 0);

  return (
    <div className="adm-shell">
      <div style={{ paddingBottom: "calc(66px + env(safe-area-inset-bottom, 0px))" }}>
        {children}
      </div>
      <TabBar dialogsBadge={dialogsBadge} />
    </div>
  );
}
