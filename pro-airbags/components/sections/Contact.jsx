'use client';
import {useState} from 'react';
import {Arrow, Check, Pin, Phone, Clock} from './Icons';

const SERVICES = ['Airbag repair / replacement', 'SRS module reset', 'Seatbelt / pretensioner repair', 'Programming & coding', 'Full post-collision rebuild', 'Not sure — diagnose it'];

export default function Contact() {
  const [done, setDone] = useState(false);
  const submit = e => { e.preventDefault(); setDone(true); };
  return (
    <section className="section contact" id="start">
      <div className="wrap contact-grid">
        <div data-reveal>
          <div className="eyebrow-row"><i /><span>Start a repair</span></div>
          <h2 className="hd hd-xl"><span className="silver">Tell us what</span><br /><span className="redtxt">deployed.</span></h2>
          <p className="lead" style={{marginTop: 26}}>Send the vehicle and what happened. A technician reviews every request and calls back with a plan and an honest estimate — usually within one business hour.</p>
          <div className="info">
            <div className="info-item panel panel-plain"><span className="ic"><Pin /></span><div><b>Shop</b><span>Detroit, Michigan · metro pick-up and delivery for shop accounts</span></div></div>
            <div className="info-item panel panel-plain"><span className="ic"><Phone /></span><div><b>Call or text</b><a href="tel:+13135550142">(313) 555-0142</a></div></div>
            <div className="info-item panel panel-plain"><span className="ic"><Clock /></span><div><b>Hours</b><span>Mon – Fri 8:00 – 6:00 · Sat 9:00 – 2:00</span></div></div>
          </div>
        </div>
        <div data-reveal>
          {done ? (
            <div className="form-done panel corner" role="status">
              <span className="ok-ring"><Check /></span>
              <h3 className="hd hd-md silver">Request received</h3>
              <p>Your request is in the queue. A technician will call back during business hours with a plan and estimate.</p>
              <span className="chip"><i />SRS · Queued</span>
            </div>
          ) : (
            <form className="form panel corner" onSubmit={submit}>
              <div className="form-row">
                <div className="field-wrap"><label htmlFor="f-name">Name</label><input className="field" id="f-name" name="name" required autoComplete="name" /></div>
                <div className="field-wrap"><label htmlFor="f-phone">Phone</label><input className="field" id="f-phone" name="phone" type="tel" required autoComplete="tel" /></div>
              </div>
              <div className="form-row">
                <div className="field-wrap"><label htmlFor="f-vehicle">Vehicle (year, make, model)</label><input className="field" id="f-vehicle" name="vehicle" placeholder="2021 Ford F-150" required /></div>
                <div className="field-wrap"><label htmlFor="f-service">Service</label>
                  <select className="field" id="f-service" name="service" defaultValue={SERVICES[0]}>{SERVICES.map(s => <option key={s}>{s}</option>)}</select>
                </div>
              </div>
              <div className="field-wrap"><label htmlFor="f-msg">What happened</label><textarea className="field" id="f-msg" name="message" placeholder="Front-end collision, driver and passenger bags deployed, both front belts locked. SRS light on." /></div>
              <button className="cta cta-red" type="submit"><i className="shine" /><span>Send request</span><Arrow w={16} /></button>
              <p className="form-note">No obligation. We never sell or share your information.</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
