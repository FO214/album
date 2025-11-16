declare module 'devcert' {
  export interface Certificate {
    key: string
    cert: string
    caPath?: string
  }

  export interface CertificateOptions {
    installCertutil?: boolean
    skipCertutilInstall?: boolean
  }

  export function certificateFor(
    domain: string | string[],
    options?: CertificateOptions,
  ): Promise<Certificate>

  const devcert: {
    certificateFor: typeof certificateFor
  }
  export default devcert
}

