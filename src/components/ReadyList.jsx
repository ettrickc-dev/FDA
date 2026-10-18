// "Have these ready" — shown before anyone starts, so they don't have to stop and search.
export const READY_ITEMS = [
  ['Your 2 most recent pay stubs', 'For gross pay, take-home pay, and what comes out for health insurance.'],
  ['Your most recent federal and state tax returns, and W-2s or 1099s', 'The court requires copies.'],
  ['Papers for any other income', 'Benefit letters for SNAP, unemployment, Social Security, pensions, and similar.'],
  ['Your health insurance card and its cost', 'Plan name, policy number, and what you pay each paycheck or month.'],
  ['Your court papers', 'File #, Docket #, and your next court date.'],
  ['Your monthly bills', 'Rent or mortgage, gas and electric, phone and internet, insurance, car payment, child care.'],
  ['Bank balances and what you own', 'Savings and checking balances, car year/make/model, any home or other assets.'],
  ['What you owe', 'Credit cards and loans: who you owe, the balance, and the payment.'],
  ['Any other child support orders you pay', 'You must attach copies.'],
];

export default function ReadyList({ title = 'Have these ready before you start', showPrint = false }) {
  return (
    <section className="card" aria-labelledby="ready-h">
      <h2 id="ready-h">{title}</h2>
      <p>Gathering these first means you can finish in one sitting (usually 20–30 minutes).</p>
      <ul className="steps ready-list">
        {READY_ITEMS.map(([what, why]) => <li key={what}><strong>{what}.</strong> {why}</li>)}
      </ul>
      {showPrint && <button type="button" className="btn no-print" onClick={() => window.print()}>Print this list</button>}
    </section>
  );
}
