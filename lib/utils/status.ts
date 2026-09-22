export function computeStatusColor(expiryDateStr: string | Date): 'Green' | 'Yellow' | 'Red' {
  const expiry = new Date(expiryDateStr);
  const today = new Date();
  
  // Reset times to compare just the dates (midnight local time)
  expiry.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Red: expiry date has passed (no grace period) -> diffDays < 0
  if (diffDays < 0) {
    return 'Red';
  } 
  // Yellow: 0–3 days until expiry -> diffDays <= 3
  else if (diffDays <= 3) {
    return 'Yellow';
  } 
  // Green: more than 3 days until expiry -> diffDays > 3
  else {
    return 'Green';
  }
}
