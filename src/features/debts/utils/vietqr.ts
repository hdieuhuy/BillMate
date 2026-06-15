/**
 * Generates the URL to render a dynamic VietQR payment code.
 * Uses the free service of VietQR (https://img.vietqr.io).
 *
 * @param bankId Identifier of the bank (e.g. vcb, mbbank, tcb, bidv, acb...)
 * @param accountNo Bank account number
 * @param amount Amount to transfer
 * @param description Memo/transfer content
 * @param accountName Cardholder name (optional)
 */
export function getVietQRUrl(
  bankId: string,
  accountNo: string,
  amount: number,
  description: string,
  accountName: string = ''
): string {
  const cleanBank = bankId.trim().toLowerCase();
  const cleanAcc = accountNo.trim();
  const cleanDesc = encodeURIComponent(description.trim());
  const cleanName = encodeURIComponent(accountName.trim());

  return `https://img.vietqr.io/image/${cleanBank}-${cleanAcc}-compact.png?amount=${amount}&addInfo=${cleanDesc}&accountName=${cleanName}`;
}
