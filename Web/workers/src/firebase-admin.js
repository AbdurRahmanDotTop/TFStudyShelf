import { SignJWT, importPKCS8 } from 'jose';

export class FirebaseAdmin {
  constructor(serviceAccountJson) {
    if (!serviceAccountJson) {
      throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON');
    }
    
    // Parse service account depending on if it's stringified
    if (typeof serviceAccountJson === 'string') {
      try {
        this.serviceAccount = JSON.parse(serviceAccountJson);
      } catch (e) {
        throw new Error('Invalid JSON in FIREBASE_SERVICE_ACCOUNT_JSON');
      }
    } else {
      this.serviceAccount = serviceAccountJson;
    }
    
    this.projectId = this.serviceAccount.project_id;
    this.clientEmail = this.serviceAccount.client_email;
    this.privateKey = this.serviceAccount.private_key;
    this.tokenCache = null;
    this.tokenExpiry = 0;
  }

  async getAccessToken() {
    const now = Math.floor(Date.now() / 1000);
    
    // Return cached token if still valid (with 5 min buffer)
    if (this.tokenCache && this.tokenExpiry > now + 300) {
      return this.tokenCache;
    }

    const alg = 'RS256';
    const privateKey = await importPKCS8(this.privateKey, alg);

    const jwt = await new SignJWT({
      iss: this.clientEmail,
      sub: this.clientEmail,
      aud: 'https://oauth2.googleapis.com/token',
      scope: 'https://www.googleapis.com/auth/identitytoolkit https://www.googleapis.com/auth/cloud-platform'
    })
      .setProtectedHeader({ alg, typ: 'JWT' })
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .sign(privateKey);

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Failed to get Google OAuth token: ${data.error_description || data.error}`);
    }

    this.tokenCache = data.access_token;
    this.tokenExpiry = now + data.expires_in;
    
    return this.tokenCache;
  }

  async listUsers(nextPageToken = null, maxResults = 1000) {
    const token = await this.getAccessToken();
    let url = `https://identitytoolkit.googleapis.com/v3/relyingparty/downloadAccount`;
    
    const body = {
      targetProjectId: this.projectId,
      maxResults: parseInt(maxResults) || 1000
    };
    if (nextPageToken) {
      body.nextPageToken = nextPageToken;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(`List users failed: ${data.error?.message || 'Unknown error'}`);
    return data;
  }

  async deleteUser(uid) {
    const token = await this.getAccessToken();
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${this.projectId}/accounts:delete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ localId: uid })
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(`Delete user failed: ${data.error?.message || 'Unknown error'}`);
    return true;
  }

  async updateUser(uid, updates = {}) {
    const token = await this.getAccessToken();
    
    const body = { localId: uid };
    if (updates.password) body.password = updates.password;
    if (updates.email) body.email = updates.email;
    if (updates.displayName) body.displayName = updates.displayName;
    if (updates.disabled !== undefined) body.disableUser = updates.disabled;
    if (updates.emailVerified !== undefined) body.emailVerified = updates.emailVerified;

    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${this.projectId}/accounts:update`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(`Update user failed: ${data.error?.message || 'Unknown error'}`);
    return data;
  }
}
