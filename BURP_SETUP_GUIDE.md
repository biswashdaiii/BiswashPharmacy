# Burp Suite Proxy Setup (Option 1)

Follow these steps to capture traffic from your Windows host in Burp Suite running inside VMware.

## 1. Get VMware IP Address
In your VMware terminal (Kali/Linux):
```bash
ip addr | grep inet
```
*Look for the IP assigned to `eth0` or `ens33`. It usually looks like `192.168.x.x`.*

---

## 2. Configure Burp Suite (In VM)
1. Open **Burp Suite Professional/Community**.
2. Go to **Proxy** tab -> **Proxy settings**.
3. Under **Proxy Listeners**:
   - Select the existing listener (`127.0.0.1:8080`) and click **Edit**.
   - Change **Bind to address** to `All interfaces`.
   - Click **OK**.
   - Click **Yes** when warned about listening on all interfaces.

---

## 3. Install Burp CA Certificate (On Windows Host)
*This is required to intercept HTTPS traffic without SSL errors.*
1. In your Windows browser (with proxy NOT yet enabled), go to `http://<VM_IP>:8080`.
2. Click **CA Certificate** in the top right to download `cacert.der`.
3. Open the file -> **Install Certificate...** -> **Local Machine**.
4. Place all certificates in the: **Trusted Root Certification Authorities** store.
5. Finish the import.

---

## 4. Enable Proxy on Windows
1. Open Windows **Settings** -> **Network & Internet** -> **Proxy**.
2. Scroll to **Manual proxy setup** -> Click **Set up**.
3. Set **Use a proxy server** to **On**.
4. **Proxy IP address**: Enter your `<VM_IP>`.
5. **Port**: `8080`.
6. Click **Save**.

---

## 5. Running the Project
Now start both backend and frontend on your Windows host:

**Backend:**
```powershell
cd d:\cw2\web_backend
npm run dev
```

**Frontend:**
```powershell
cd d:\cw2\web_frontend
npm run dev
```

---

## 6. Access & Intercept
- Open Chrome/Firefox on Windows.
- Navigate to `http://localhost:5173`.
- Go to Burp Suite -> **Proxy** -> **Intercept** and turn **Intercept is on** to capture requests!
