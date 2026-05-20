export function formatBreachMessage(count: number): string {
  if (count === 0) return ''
  if (count === 1) return 'This password has appeared in a data breach. Please choose a different password.'
  if (count < 10) return `This password has appeared in ${count} data breaches. Please choose a different password.`
  if (count < 100) return `This password has appeared in ${count} data breaches and is not safe to use.`
  if (count < 1000) return `This password has appeared in ${count} data breaches. It is very unsafe.`
  return `This password has appeared in ${count.toLocaleString()} data breaches. Do not use it under any circumstances.`
}
