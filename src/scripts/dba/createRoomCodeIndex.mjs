import db from '../../server/db.mjs';

try {
  await db.collection('rooms').createIndex({roomCode: 1}, {name: 'roomCodeIndex'});
} catch (e) {
  console.log(`Failed to create index: ${e}`);
  process.exit(1);
}

console.log('Successfully created index.');
process.exit(0);
