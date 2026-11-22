const test = require('node:test');
const assert = require('node:assert/strict');

const orders = require('../lib/orders');
const dates = require('../lib/dates');
const ledger = require('../lib/ledger');

function orderDb() {
  return {
    orders: [
      { id: 1, date: '15/03/2022' },
      { id: 2, date: '30/01/2022' },
      { id: 3, date: '28/12/2021' }
    ]
  };
}

function ledgerDb() {
  return {
    nextSettlementId: 501,
    settlements: [],
    customers: [{
      id: 1,
      name: 'Meera Joshi',
      openingBalance: 450,
      totalBilled: 1982.01,
      totalSettled: 1200,
      balance: 1232.01
    }]
  };
}

test('orders use real dates and settlements validate numeric amounts', () => {
  const db = orderDb();
  assert.deepEqual(orders.list(db).map((order) => order.date), [
    '15/03/2022', '30/01/2022', '28/12/2021'
  ]);
  assert.deepEqual(orders.list(db, {
    from: '2022-01-01',
    to: '2022-02-28'
  }).map((order) => order.date), ['30/01/2022']);

  const settlementDb = ledgerDb();
  const settled = ledger.recordSettlement(settlementDb, 1, '500');
  assert.equal(settled.ok, true);
  assert.equal(settled.customer.totalSettled, 1700);
  assert.equal(settled.customer.balance, 732.01);

  for (const invalidAmount of [0, -50, 'not-a-number']) {
    const invalidDb = ledgerDb();
    const result = ledger.recordSettlement(invalidDb, 1, invalidAmount);
    assert.equal(result.ok, false);
    assert.equal(invalidDb.customers[0].totalSettled, 1200);
    assert.equal(invalidDb.customers[0].balance, 1232.01);
    assert.equal(invalidDb.settlements.length, 0);
  }
});

test('orders.list sorts dates chronologically, newest first', () => {
  const result = orders.list(orderDb());

  assert.deepEqual(result.map((order) => order.date), [
    '15/03/2022', '30/01/2022', '28/12/2021'
  ]);
});

test('orders.list from YYYY-MM-DD filter includes dates on or after the date', () => {
  const result = orders.list(orderDb(), { from: '2022-02-01' });

  assert.deepEqual(result.map((order) => order.date), [
    '15/03/2022'
  ]);
});

test('orders.list to YYYY-MM-DD filter includes dates on or before the date', () => {
  const result = orders.list(orderDb(), { to: '2022-02-28' });

  assert.deepEqual(result.map((order) => order.date), [
    '30/01/2022', '28/12/2021'
  ]);
});

test('orders.list combined YYYY-MM-DD filters return only dates in the range', () => {
  const result = orders.list(orderDb(), {
    from: '2022-02-01',
    to: '2022-02-28'
  });

  assert.deepEqual(result, []);
});

test('dates.normalizeDateKey returns validated sortable keys for supported formats', () => {
  assert.equal(dates.normalizeDateKey('2022-03-15'), '2022-03-15');
  assert.equal(dates.normalizeDateKey(' 15/03/2022 '), '2022-03-15');
  assert.equal(dates.normalizeDateKey('2022-3-5'), '2022-03-05');
  assert.equal(dates.normalizeDateKey('not-a-date'), '');
  assert.equal(dates.normalizeDateKey('31/02/2022'), '');
  assert.equal(dates.normalizeDateKey(''), '');
  assert.equal(dates.getFiscalYear('15/03/2022'), 'FY21-22');
  assert.equal(dates.getFiscalYear('01/04/2022'), 'FY22-23');
});

test('CURRENT BEHAVIOUR: ledger.recordSettlement with numeric 500 updates balance arithmetically', () => {
  const db = ledgerDb();
  const result = ledger.recordSettlement(db, 1, 500, 'cash', 'counter payment');

  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(result.settlement.amount, 500);
  assert.equal(db.settlements.length, 1);
});

test('ledger.recordSettlement treats string "500" as a number', () => {
  const db = ledgerDb();
  const result = ledger.recordSettlement(db, 1, '500', 'upi', 'JSON body');

  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(result.settlement.amount, 500);
});

test('CURRENT BEHAVIOUR: ledger.recordSettlement rejects zero without changing customer', () => {
  const db = ledgerDb();
  const result = ledger.recordSettlement(db, 1, 0);

  assert.equal(result.ok, false);
  assert.equal(db.customers[0].totalSettled, 1200);
  assert.equal(db.customers[0].balance, 1232.01);
  assert.equal(db.settlements.length, 0);
});

test('CURRENT BEHAVIOUR: ledger.recordSettlement rejects negative amount without changing customer', () => {
  const db = ledgerDb();
  const result = ledger.recordSettlement(db, 1, -50);

  assert.equal(result.ok, false);
  assert.equal(db.customers[0].totalSettled, 1200);
  assert.equal(db.customers[0].balance, 1232.01);
  assert.equal(db.settlements.length, 0);
});

test('ledger.recordSettlement rejects non-numeric amount without corrupting totals', () => {
  const db = ledgerDb();
  const result = ledger.recordSettlement(db, 1, 'not-a-number');

  assert.equal(result.ok, false);
  assert.equal(db.customers[0].totalSettled, 1200);
  assert.equal(db.customers[0].balance, 1232.01);
  assert.equal(db.settlements.length, 0);
});
