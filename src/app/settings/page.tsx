import { LOCAL_PROTOCOL } from "@/clinical/spec/local-protocol";
import { APP_VERSION, SPEC_VERSION } from "@/clinical/spec/version";
import { Badge, Card } from "@/ui/primitives";

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-[28px] font-semibold leading-tight tracking-tight">Settings</h1>
      <Card title="Local protocol" subtitle="Hospital-set values. Changed only through a reviewed code change, not on the device.">
        <div><Badge tone="moderate">Pending gastroenterologist sign-off</Badge></div>
        <div>
          <p className="text-[14px] font-semibold text-ink-muted">Line shown under every emergency warning</p>
          <p className="mt-1 text-[17px] font-semibold">“{LOCAL_PROTOCOL.escalationText}”</p>
        </div>
        <div>
          <p className="text-[14px] font-semibold text-ink-muted">Pediatric pathway</p>
          <p className="mt-1">Age under {LOCAL_PROTOCOL.pediatricAgeCutoffYears} years</p>
        </div>
        <div>
          <p className="text-[14px] font-semibold text-ink-muted">Warning thresholds (proposed defaults)</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {Object.values(LOCAL_PROTOCOL.thresholds).map((t) => <li key={t.rule}>{t.rule}</li>)}
          </ul>
        </div>
      </Card>
      <Card title="About">
        <p>App version {APP_VERSION} · Scoring spec {SPEC_VERSION}</p>
        <p className="text-[15px] text-ink-muted">No data is stored on this device or any server.</p>
      </Card>
    </div>
  );
}
