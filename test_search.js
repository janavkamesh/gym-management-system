const members = [
  { name: 'John Doe', phone: '9876543210', uid: 'MA-0008' },
  { name: 'Jane Smith', phone: '1122334455', uid: 'MA-0018' },
  { name: 'Bob Jones', phone: '9988776655', uid: 'MA-0080' },
  { name: 'Alice 08', phone: '5566778899', uid: 'MA-0009' }
];

function testSearch(searchQuery) {
  return members.filter(member => {
    const lowerQ = searchQuery.toLowerCase();
    const matchesName = member.name?.toLowerCase().includes(lowerQ);
    const matchesUid = member.uid?.toLowerCase().includes(lowerQ);
    return matchesName || matchesUid;
  }).length;
}

function oldSearch(searchQuery) {
  return members.filter(member => {
    const lowerQ = searchQuery.toLowerCase();
    return member.name?.toLowerCase().includes(lowerQ) || member.phone?.includes(searchQuery);
  }).length;
}

console.log('Total members:', members.length);

console.log('--- TEST 1: Partial UID (e.g., "08") ---');
console.log('New logic matches:', testSearch('08')); // matches: MA-0008, MA-0018, MA-0080, Alice 08

console.log('--- TEST 2: Full Name Fragment (e.g., "Jane") ---');
console.log('Old logic matches:', oldSearch('Jane'));
console.log('New logic matches:', testSearch('Jane'));

console.log('--- TEST 3: Phone Number (e.g., "9876") ---');
console.log('Old logic matches:', oldSearch('9876'));
console.log('New logic matches:', testSearch('9876'));
