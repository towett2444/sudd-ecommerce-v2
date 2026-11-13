import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, CreditCard, Loader2, Smartphone, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import { dateTime, errorMessage, ksh, PAYMENT_METHOD } from '../../lib/format';
import { getPaymentStatus, sendTestResult, startCard, startMpesa } from '../../services/shop.service';

const POLL_MS = 3000;
const GIVE_UP_MS = 3 * 60 * 1000;

// Waits for the M-Pesa / card payment of an order and shows the confirmation.
const Payment = () => {
  const { orderId } = useParams();
  const [state, setState] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [phone, setPhone] = useState('');
  const [timedOut, setTimedOut] = useState(false);
  const startedAt = useRef(Date.now());

  const load = useCallback(async () => {
    try {
      const d = await getPaymentStatus(orderId);
      setState(d);
      setPhone((p) => p || (d.payment.phone ? `0${d.payment.phone.slice(3)}` : ''));
      return d;
    } catch (e) {
      setError(errorMessage(e, 'Could not load this payment.'));
      return null;
    }
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  // Poll while the customer is completing the payment
  useEffect(() => {
    if (!state || state.paymentStatus !== 'PENDING' || !state.payment.awaiting || state.payment.demo) return undefined;
    const id = setInterval(async () => {
      if (Date.now() - startedAt.current > GIVE_UP_MS) {
        setTimedOut(true);
        clearInterval(id);
        return;
      }
      const d = await load();
      if (d && d.paymentStatus !== 'PENDING') clearInterval(id);
    }, POLL_MS);
    return () => clearInterval(id);
  }, [state, load]);

  const retryMpesa = async (e) => {
    e?.preventDefault();
    setBusy(true);
    try {
      const d = await startMpesa(orderId, phone);
      toast.success(d.payment.demo ? 'Test payment request created.' : 'Payment request sent. Check your phone.');
      startedAt.current = Date.now();
      setTimedOut(false);
      setState(d);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not send the M-Pesa request.'));
    } finally {
      setBusy(false);
    }
  };

  const payByCard = async () => {
    setBusy(true);
    try {
      const d = await startCard(orderId);
      if (d.authorizationUrl) {
        window.location.assign(d.authorizationUrl);
        return;
      }
      setState(d);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not start the card payment.'));
    } finally {
      setBusy(false);
    }
  };

  const simulate = async (result) => {
    setBusy(true);
    try {
      setState(await sendTestResult(orderId, result));
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <main className="mx-auto max-w-lg py-20 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <Link to="/orders" className="mt-6 inline-block text-sm underline">My orders</Link>
      </main>
    );
  }
  if (!state) return <main className="py-20 text-center text-sm text-gray-500">Loading payment…</main>;

  const paid = state.paymentStatus === 'PAID';
  const failed = state.paymentStatus === 'FAILED';
  const cancelled = state.orderStatus === 'CANCELLED';
  const waiting = !paid && !failed && state.payment.awaiting;
  const isMpesa = state.paymentMethod === 'MPESA';

  return (
    <main className="mx-auto max-w-xl py-12 sm:py-16">
      <div className="border border-gray-200 p-6 text-center sm:p-10">
        {paid ? (
          <>
            <CheckCircle2 size={52} strokeWidth={1.4} className="mx-auto text-green-600" />
            <h1 className="mt-5 text-2xl font-medium text-gray-950">Payment received — thank you!</h1>
            <p className="mt-2 text-sm text-gray-500">Your order {state.orderNumber} is confirmed and we're preparing it.</p>
            <dl className="mx-auto mt-8 max-w-sm divide-y divide-gray-100 border-y border-gray-100 text-left text-sm">
              <Line label="Amount paid" value={ksh(state.total)} />
              <Line label="Method" value={PAYMENT_METHOD[state.paymentMethod]} />
              {state.payment.receipt && <Line label={isMpesa ? 'M-Pesa receipt' : 'Transaction'} value={state.payment.receipt} />}
              <Line label="Paid on" value={dateTime(state.paidAt)} />
            </dl>
            {state.payment.demo && <p className="mt-4 text-xs text-amber-700">Test payment — no real money was taken.</p>}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link to={`/orders/${orderId}`} className="bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800">Track my order</Link>
              <Link to="/collection" className="border border-gray-300 px-6 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50">Continue shopping</Link>
            </div>
          </>
        ) : cancelled ? (
          <>
            <XCircle size={48} strokeWidth={1.4} className="mx-auto text-gray-400" />
            <h1 className="mt-5 text-2xl font-medium text-gray-950">This order was cancelled</h1>
            <p className="mt-2 text-sm text-gray-500">It can no longer be paid. Please place a new order.</p>
            <Link to="/collection" className="mt-8 inline-block bg-black px-6 py-3 text-sm font-medium text-white">Back to shop</Link>
          </>
        ) : (
          <>
            {waiting && !timedOut ? (
              <Loader2 size={46} strokeWidth={1.4} className="mx-auto animate-spin text-gray-400" />
            ) : failed ? (
              <XCircle size={48} strokeWidth={1.4} className="mx-auto text-red-500" />
            ) : isMpesa ? (
              <Smartphone size={46} strokeWidth={1.3} className="mx-auto text-gray-500" />
            ) : (
              <CreditCard size={46} strokeWidth={1.3} className="mx-auto text-gray-500" />
            )}

            <h1 className="mt-5 text-2xl font-medium text-gray-950">
              {failed ? 'Payment not completed' : waiting && isMpesa ? 'Check your phone' : 'Complete your payment'}
            </h1>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              {failed
                ? state.payment.message || 'The payment did not go through.'
                : waiting && isMpesa
                  ? `Enter your M-Pesa PIN on ${phone || 'your phone'} to pay ${ksh(state.total)} for order ${state.orderNumber}.`
                  : `Order ${state.orderNumber} — ${ksh(state.total)} to pay.`}
            </p>
            {timedOut && waiting && (
              <p className="mt-3 text-sm text-amber-700">Still waiting for confirmation. If you paid, it will show here shortly — otherwise send the request again.</p>
            )}

            {state.payment.demo && waiting && (
              <div className="mt-6 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-medium">Test mode — no real money</p>
                <p className="mt-1 text-xs">Simulate what the customer does:</p>
                <div className="mt-3 flex justify-center gap-3">
                  <button type="button" disabled={busy} onClick={() => simulate('success')} className="cursor-pointer bg-green-700 px-4 py-2 text-xs font-medium text-white disabled:opacity-60">
                    Payment succeeds
                  </button>
                  <button type="button" disabled={busy} onClick={() => simulate('failed')} className="cursor-pointer border border-amber-300 bg-white px-4 py-2 text-xs font-medium disabled:opacity-60">
                    {isMpesa ? 'Customer cancels' : 'Card declined'}
                  </button>
                </div>
              </div>
            )}

            {(!waiting || timedOut || failed) && (
              <div className="mx-auto mt-8 max-w-sm space-y-4 text-left">
                <form onSubmit={retryMpesa} className="space-y-3">
                  <label className="block">
                    <span className="mb-2 block text-xs font-medium text-gray-600">M-Pesa number</span>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XX XXX XXX" className="input" required />
                  </label>
                  <button type="submit" disabled={busy} className="flex w-full cursor-pointer items-center justify-center gap-2 bg-[#00a651] px-5 py-3 text-sm font-medium text-white disabled:opacity-60">
                    <Smartphone size={16} /> {isMpesa && (failed || timedOut || waiting) ? 'Send M-Pesa request again' : 'Pay with M-Pesa'}
                  </button>
                </form>
                <button type="button" disabled={busy} onClick={payByCard} className="flex w-full cursor-pointer items-center justify-center gap-2 border border-gray-300 px-5 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-60">
                  <CreditCard size={16} /> Pay by card instead
                </button>
              </div>
            )}

            <p className="mt-8 text-xs text-gray-400">
              Unpaid orders are cancelled after 2 hours. <Link to={`/orders/${orderId}`} className="underline">View order</Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
};

const Line = ({ label, value }) => (
  <div className="flex justify-between gap-4 py-3">
    <dt className="text-gray-500">{label}</dt>
    <dd className="text-right font-medium text-gray-900">{value}</dd>
  </div>
);

export default Payment;
