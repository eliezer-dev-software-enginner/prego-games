//app/lib/common.ts

export function isProductionMode() {
  return process.env.NODE_ENV === 'production';
}
