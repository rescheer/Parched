import { SHA256, HmacSHA256, enc } from 'crypto-js';

export default class AuthProvider {
  // Constructor
  constructor() {
    this.#initialized = false;
  }

  // Static Vars
  static requests = {
    common: {
      headers: {
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/x-amz-json-1.1',
      },
    },
    cognito: {
      method: 'GET',
      url: 'https://poachedjobs.com/api/v1/auth/cognito',
    },
    identity: {
      method: 'POST',
      url: 'https://cognito-identity.us-west-2.amazonaws.com',
      id: {
        headers: {
          accept: '*/*',
          'x-amz-target': 'AWSCognitoIdentityService.GetId',
          'x-amz-user-agent': 'aws-amplify/5.3.12 framework/0',
        },
        bodyKey: 'IdentityPoolId',
      },
      credential: {
        method: 'POST',
        headers: {
          accept: '*/*',
          'x-amz-target': 'AWSCognitoIdentityService.GetCredentialsForIdentity',
          'x-amz-user-agent': 'aws-amplify/5.3.12 framework/0',
        },
        bodyKey: 'IdentityId',
      },
    },
    token: {
      method: 'GET',
      url: 'https://pstktaeh2e.execute-api.us-west-2.amazonaws.com/production/generate-token',
      headers: {
        accept: 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9',
        authorization: '',
      },
      signedHeaders: {
        host: '',
        'x-amz-date': '',
        'x-amz-security-token': '',
      },
    },
  };

  // Public Methods
  async refreshToken() {
    this.#poolId = await this.#getPoolId();
    this.#identId = await this.#getIdentId();
    this.#credentials = await this.#getCredentials();
    this.#token = await this.#getToken();

    this.#initialized = true;

    return this.#token;
  }

  clearToken() {
    this.#token = null;
  }

  // Private Methods
  /**
   * Splits a URL into a hostname and a URI
   * @param {string} url the URL to be split
   * @returns {string[]} an array containing [host, uri]
   */
  #splitUrl = (url) => {
    const cleanUrl = url.replace(/https?:\/\//g, '');
    const sep = cleanUrl.indexOf('/');
    const host = cleanUrl.slice(0, sep);
    const uri = cleanUrl.slice(sep);

    return [host, uri];
  };

  #getFormattedDate = (time = false) => {
    if (time) {
      return new Date().toISOString().split('.')[0].replace(/[-.:]/g, '') + 'Z';
    }
    return new Date().toISOString().slice(0, 10).replace(/-/g, '');
  };

  #getPoolId = async () => {
    const { cognito } = AuthProvider.requests;
    const stream = await fetch(cognito.url, {
      method: cognito.method,
    });
    const response = await stream.json();
    return response.cognito.identityPoolId;
  };

  #getIdentId = async () => {
    const { identity } = AuthProvider.requests;
    const body = JSON.stringify({ [identity.id.bodyKey]: this.#poolId });
    const headers = AuthProvider.requests.common.headers;
    Object.assign(headers, identity.id.headers);
    const stream = await fetch(identity.url, {
      headers: headers,
      body: body,
      method: identity.method,
    });
    const response = await stream.json();
    return response.IdentityId;
  };

  #getCredentials = async () => {
    const { identity } = AuthProvider.requests;
    const body = JSON.stringify({
      [identity.credential.bodyKey]: this.#identId,
    });
    const headers = AuthProvider.requests.common.headers;
    Object.assign(headers, identity.credential.headers);
    const stream = await fetch(identity.url, {
      method: identity.method,
      body: body,
      headers: headers,
    });
    const response = await stream.json();
    return response.Credentials;
  };

  #getToken = async () => {
    const { token } = AuthProvider.requests;
    const headers = {};
    Object.assign(headers, this.#getFilledHeaders());
    headers.authorization = this.#getAuthHeader();
    const stream = await fetch(token.url, {
      method: token.method,
      headers: headers,
    });
    const response = await stream.json();
    return response.token;
  };

  #getFilledHeaders = () => {
    const { signedHeaders, url } = AuthProvider.requests.token;

    signedHeaders.host = this.#splitUrl(url)[0];
    signedHeaders['x-amz-date'] = this.#getFormattedDate(true);
    signedHeaders['x-amz-security-token'] = this.#credentials.SessionToken;
    return signedHeaders;
  };

  #getCanonicalHeaders = () => {
    let result = '';
    const headers = this.#getFilledHeaders();
    const sortedHeaderKeys = Object.keys(headers).sort();
    sortedHeaderKeys.forEach((key, index) => {
      const value = headers[key];
      result = result.concat(key, ':', value);
      if (index < sortedHeaderKeys.length) {
        result = result.concat('\n');
      }
    });
    return result;
  };

  #getSignedHeaderString = () => {
    const { signedHeaders } = AuthProvider.requests.token;

    return Object.keys(signedHeaders).sort().join(';');
  };

  #getStringToSign = (keys) => {
    const { token } = AuthProvider.requests;
    let canonicalRequest = '';
    canonicalRequest = canonicalRequest
      .concat(token.method, '\n') // HTTP Method
      .concat(this.#splitUrl(token.url)[1], '\n') // Canonical URI
      .concat('', '\n') // Canonical Query string
      .concat(this.#getCanonicalHeaders(), '\n') // Canonical headers
      .concat(this.#getSignedHeaderString(), '\n') // Signed headers
      .concat(SHA256('')); // Payload

    let stringToSign = 'AWS4-HMAC-SHA256' + '\n';
    stringToSign = stringToSign
      .concat(this.#getFormattedDate(true), '\n')
      .concat(`${keys.date}/${keys.region}/${keys.service}/${keys.type}`, '\n')
      .concat(SHA256(canonicalRequest));

    return stringToSign;
  };

  #getSigningKey = (keys) => {
    const dateKey = HmacSHA256(keys.date, `AWS4${this.#credentials.SecretKey}`);
    const dateRegionKey = HmacSHA256(keys.region, dateKey);
    const dateRegionServiceKey = HmacSHA256(keys.service, dateRegionKey);
    const signingKey = HmacSHA256(keys.type, dateRegionServiceKey);

    return signingKey;
  };

  #getSignature = (keys) => {
    return HmacSHA256(
      this.#getStringToSign(keys),
      this.#getSigningKey(keys),
    ).toString(enc.Hex);
  };

  #getAuthHeader = () => {
    const keys = {
      date: this.#getFormattedDate(),
      region: 'us-west-2',
      service: 'execute-api',
      type: 'aws4_request',
    };
    const prefix = 'AWS4-HMAC-SHA256 Credential=';
    const signedHeaderString = `SignedHeaders=${this.#getSignedHeaderString()}, `;

    return `${prefix}${this.#credentials.AccessKeyId}/${keys.date}/${
      keys.region
    }/${keys.service}/${keys.type}, `
      .concat(signedHeaderString)
      .concat(`Signature=${this.#getSignature(keys)}`);
  };

  // Private properties
  #poolId;

  #identId;

  #credentials;

  #token;

  #initialized;

  // Getters
  get token() {
    return this.#token;
  }

  get isInitialized() {
    return this.#initialized;
  }

  get expiration() {
    return this.#credentials.Expiration;
  }
}
