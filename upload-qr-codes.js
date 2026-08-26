// This script helps you verify QR code URLs are accessible
// Upload your QR code images manually via Supabase Dashboard

const QR_CODE_BASE_URL = 'https://fqeyrtjlfnsxgwczcrvx.supabase.co/storage/v1/object/public/payment-qr-codes'

const qrCodes = [
  { file: 'usdt-erc20.png', url: `${QR_CODE_BASE_URL}/usdt-erc20.jpg` },
  { file: 'usdt-trc20.png', url: `${QR_CODE_BASE_URL}/usdt-trc20.jpg` },
  { file: 'usdt-bep20.png', url: `${QR_CODE_BASE_URL}/usdt-bep20.jpg` },
]

console.log('Upload these files to Supabase Storage bucket "payment-qr-codes":')
qrCodes.forEach(qr => {
  console.log(`\nFile: ${qr.file}`)
  console.log(`URL will be: ${qr.url}`)
})

console.log('\n\nSteps:')
console.log('1. Go to https://supabase.com/dashboard')
console.log('2. Select your project')
console.log('3. Go to Storage')
console.log('4. Create bucket "payment-qr-codes" (Public)')
console.log('5. Upload your 3 QR code images')
console.log('6. Name them exactly:')
console.log('   - usdt-erc20.jpg')
console.log('   - usdt-trc20.jpg')
console.log('   - usdt-bep20.jpg')