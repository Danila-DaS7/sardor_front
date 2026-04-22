import { useConvexQuery } from "../hooks/useConvexQuery.js";
import {
  getTelegramAuthPayload,
  getTelegramUser,
  isTelegramBypassEnabled
} from "../lib/telegram.js";

export default function Whoami() {
  const authData = getTelegramAuthPayload();
  const bypassEnabled = isTelegramBypassEnabled();
  const query = useConvexQuery(
    "auth_debug:whoami",
    authData || bypassEnabled ? { authData: authData || "" } : null
  );
  const data = query.data;
  const user = getTelegramUser();

  return (
    <div className="admin">
      <div className="admin__card">
        <h1>Auth Debug</h1>
        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {JSON.stringify(
            {
              telegram: {
                hasInitData: Boolean(authData),
                user
              }
            },
            null,
            2
          )}
        </pre>
        <hr style={{ margin: "12px 0" }} />
        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}
