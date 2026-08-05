export type FlyntAccountStatus = {
  exists: boolean;
  legal: {
    acceptedAt: string | null;
    termsVersion: string | null;
  } | null;
};

export function hasCurrentFlyntAccount(
  status: FlyntAccountStatus,
  currentTermsVersion: string,
) {
  return status.exists
    && Boolean(status.legal?.acceptedAt)
    && status.legal?.termsVersion === currentTermsVersion;
}
