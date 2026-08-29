import { updateSettings } from "@/app/actions/settings";
import type { ShopSettingsView } from "@/lib/settings";
import { ImageUpload } from "@/components/ImageUpload";

export function SettingsForm({
  settings,
  error,
  saved,
}: {
  settings: ShopSettingsView;
  error?: string;
  saved?: boolean;
}) {
  return (
    <form action={updateSettings} className="panel form-card" encType="multipart/form-data">
      <div className="field">
        <label htmlFor="shopName">Nama toko</label>
        <input
          id="shopName"
          name="shopName"
          type="text"
          defaultValue={settings.shopName}
          maxLength={40}
          required
        />
        <p className="hint">Muncul di navigasi, halaman login, dan header nota.</p>
      </div>

      <ImageUpload
        name="logo"
        label="Logo toko (opsional)"
        currentUrl={settings.logoUrl}
        removeName="removeLogo"
        shape="square"
        maxSide={400}
      />

      <hr className="divider" />

      <div className="field">
        <label htmlFor="address">Alamat (tampil di header nota)</label>
        <input id="address" name="address" type="text" defaultValue={settings.address} />
      </div>
      <div className="field">
        <label htmlFor="phone">Telepon</label>
        <input id="phone" name="phone" type="text" defaultValue={settings.phone} />
      </div>
      <div className="field">
        <label htmlFor="headerNote">Catatan header (opsional)</label>
        <input
          id="headerNote"
          name="headerNote"
          type="text"
          defaultValue={settings.headerNote ?? ""}
        />
      </div>
      <div className="field">
        <label htmlFor="footerNote">Catatan footer (opsional)</label>
        <textarea
          id="footerNote"
          name="footerNote"
          rows={3}
          defaultValue={settings.footerNote ?? ""}
        />
      </div>
      <div className="field">
        <label htmlFor="startingReceiptNo">Nomor awal nota</label>
        <input
          id="startingReceiptNo"
          name="startingReceiptNo"
          type="number"
          min={1}
          step={1}
          defaultValue={settings.startingReceiptNo}
        />
        <p className="hint">
          Nomor nota berikutnya melanjutkan dari nomor tertinggi yang sudah
          dipakai; menurunkan nilai ini tidak akan menimpa nomor lama.
        </p>
      </div>

      {error ? <p className="error">{error}</p> : null}
      {saved ? <p className="ok-text">Pengaturan tersimpan.</p> : null}

      <button className="btn" type="submit">
        Simpan pengaturan
      </button>
    </form>
  );
}
