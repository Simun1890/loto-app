import QRCode from 'qrcode';

export async function generatePngQr(data: string): Promise<Buffer> {
  return await QRCode.toBuffer(data, { type: 'png', errorCorrectionLevel: 'M', margin: 1, width: 360 });
}
