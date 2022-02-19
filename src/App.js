import './App.css';
import { useState } from 'react';
import ReactModal from 'react-modal';
import venueIds from './venueIds';
import cookie1 from './cookie1.png';
import cookie2 from './cookie2.png';

function App() {
  const [date, setDate] = useState('');
  const [cookie, setCookie] = useState('');
  const [slots, setSlots] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [displayError, setDisplayError] = useState(false);
  const [resultCount, setResultCount] = useState(venueIds.length);
  const [showModal, setShowModal] = useState(false);

  const filteredSlots = slots.filter(
    item => item.venue.toLowerCase().includes(filterText.toLowerCase()) ||
            item.court.toLowerCase().includes(filterText.toLowerCase()) ||
            item.slots.toLowerCase().includes(filterText.toLowerCase())
  );

  function search() {
    if (!date || !cookie) {
      setDisplayError(true);
      return;
    }
    setDisplayError(false);
    setSlots([]);
    setResultCount(0);
    venueIds.forEach(async (venueId) => {
      const venueSlots = await getTimeslots(venueId);
      console.log(venueSlots);
      setSlots(prevSlots => {
        return [...prevSlots, ...venueSlots].sort((a, b) => {
          if (a.venue < b.venue) {
            return -1;
          } else if (a.venue > b.venue) {
            return 1;
          } else {
            return 0;
          }
        });
      });
      setResultCount(prevCount => prevCount + 1);
    });
  }

  async function getTimeslots(venueId) {
    const url = 'https://badminton-backend.herokuapp.com/';
    const time = Date.parse(date) / 1000 - 8 * 60 * 60;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        venue: venueId,
        time,
        cookie,
      }),
    });
    const text = await response.text();
    const document = new DOMParser().parseFromString(text, 'text/html');
    const venueSlots = [];
    const venue = document.getElementsByClassName('item-desc-subtitle')[0]
                           .textContent;
    const allSlots = document.getElementsByName('timeslots[]');
    // OnePA slots also have name="timeslots[]" but different value
    const schoolSlots = [...allSlots].filter(elem => elem.value.startsWith('Court'));
    if (schoolSlots.length > 0) {
      const courtSlots = new Map();
      schoolSlots.forEach(elem => {
        const details = elem.value.split(';');
        const court = details[0];
        const timeslot = details[3];
        const timeAmPm = convertTimeToAmPm(timeslot);
        if (!courtSlots.has(court)) {
          courtSlots.set(court, [timeAmPm]);
        } else {
          courtSlots.get(court).push(timeAmPm);
        }
      });
      courtSlots.forEach((s, c) => {
        venueSlots.push({ venue: venue, court: c, slots: s.join(', ') });
      });
    } else {
      venueSlots.push({ venue: venue, court: '-', slots: '-' });
    }
    return venueSlots;
  }

  function convertTimeToAmPm(timeStr) {
    // timeStr format = HH:mm:ss
    let suffix = 'am';
    let hour = parseInt(timeStr.slice(0, 2));
    if (hour >= 12) {
      suffix = 'pm'
    }
    if (hour > 12) {
      hour = hour - 12;
    }
    const time = `${hour}${suffix}`;
    return time;
  }

  return (
    <main className="container-fluid">
      <h3 className="mt-2">Badminton Court (ActiveSG)</h3>
      <p>- Search for available courts at schools and sports halls -</p>
      <div id="form">
        <div className="mb-3">
          <label htmlFor="date" className="form-label">Date</label>
          <input
            type="date"
            className="form-control"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          { displayError && !date &&
            <div className="text-danger small mt-1">
              Please enter date
            </div>
          }
        </div>
        <div className="mb-4">
          <label htmlFor="cookie" className="form-label">
            Cookie
          </label>
          <span id="modal-link" onClick={() => setShowModal(true)}>(?)</span>
          <input
            type="text"
            className="form-control"
            id="cookie"
            placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            value={cookie}
            onChange={(e) => setCookie(e.target.value)}
          />
          { displayError && !cookie &&
            <div className="text-danger small mt-1">
              Please provide cookie
            </div>
          }
        </div>
        <button
          className="btn btn-primary w-100 mb-4"
          onClick={search}
          disabled={resultCount !== venueIds.length}
        >
          { resultCount !== venueIds.length ?
            `Searching... (${resultCount}/${venueIds.length})` : 'Search'
          }
        </button>
      </div>
      { slots.length !== 0 &&
        <input
          type="text"
          id="filter"
          className="form-control mb-4"
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          placeholder="Enter text to filter search results"
        />
      }
      <table className="table table-bordered border-dark">
        <thead>
          <tr>
            <th>Venue</th>
            <th>Court</th>
            <th>Available Slot(s)</th>
          </tr>
        </thead>
        <tbody>
          { filteredSlots.map((s, index) =>
            <tr key={index}>
              <td>{s.venue}</td>
              <td>{s.court}</td>
              <td>{s.slots}</td>
            </tr>
          ) }
        </tbody>
      </table>
      <ReactModal
        isOpen={showModal}
        onRequestClose={() => setShowModal(false)}
        ariaHideApp={false}
      >
        <h5>Why need cookie?</h5>
        <ul>
          <li>ActiveSG only displays slots when logged in</li>
          <li>This cookie is a form of authentication/identity</li>
          <li>If you anyhow key in a random value, the result will be no slots</li>
        </ul>
        <h5>How to get cookie?</h5>
        <ol>
          <li>Log in to ActiveSG</li>
          <a href="https://members.myactivesg.com/">
            https://members.myactivesg.com/
          </a>
          <p></p>
          <li>Press F12 for Developer Tools</li>
          <p></p>
          <img
            src={cookie1}
            className="w-100 border border-secondary"
            alt="cookie instruction 1"
          />
          <p></p>
          <li>Go to "Application" tab. Copy the value for "ActiveSG" cookie (circled in blue).</li>
          <p></p>
          <img
            src={cookie2}
            className="w-100 border border-secondary"
            alt="cookie instruction 2"
          />
          <p></p>
          <li>Press 'Esc' or click outside to close this pop-up. Paste the cookie value into the "Cookie" field.</li>
        </ol>
      </ReactModal>
    </main>
  );
}

export default App;