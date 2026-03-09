let nav = 0;
let clickedDate = null;
let events = localStorage.getItem('clubEvents') ? JSON.parse(localStorage.getItem('clubEvents')) : [];

// Current session state
let currentUser = {
    isLoggedIn: false,
    clubName: '',
    userName: ''
};

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// --- AUTHENTICATION ---
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
    document.getElementById('modalBackdrop').style.display = 'block';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('modalBackdrop').style.display = 'none';
}

function handleAuth() {
    const club = document.getElementById('loginClub').value.trim();
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value;

    if (pass === "college123" && club !== "" && user !== "") {
        currentUser = { isLoggedIn: true, clubName: club, userName: user };
        
        document.getElementById('login-trigger-btn').classList.add('hidden');
        document.getElementById('admin-controls').classList.remove('hidden');
        document.getElementById('admin-msg').innerText = `President: ${user} (${club})`;
        
        closeLoginModal();
        load(); // Refresh to enable interaction
    } else {
        alert("Please fill all fields. Password is 'college123'");
    }
}

function logout() {
    currentUser = { isLoggedIn: false, clubName: '', userName: '' };
    document.getElementById('login-trigger-btn').classList.remove('hidden');
    document.getElementById('admin-controls').classList.add('hidden');
    load();
}

// --- CALENDAR LOGIC ---
function load() {
    const dt = new Date();
    if (nav !== 0) dt.setMonth(new Date().getMonth() + nav);

    const month = dt.getMonth();
    const year = dt.getFullYear();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dateString = firstDay.toLocaleDateString('en-us', { weekday: 'long' });
    const paddingDays = weekdays.indexOf(dateString);

    document.getElementById('monthDisplay').innerText = 
        `${dt.toLocaleDateString('en-us', { month: 'long' })} ${year}`;

    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';

    for(let i = 1; i <= paddingDays + daysInMonth; i++) {
        const daySquare = document.createElement('div');
        daySquare.classList.add('day');
        const dayString = `${month + 1}/${i - paddingDays}/${year}`;

        if (i > paddingDays) {
            daySquare.innerText = i - paddingDays;
            
            const dayEvents = events.filter(e => e.date === dayString);
            if (dayEvents.length > 0) {
                const eventIndicator = document.createElement('div');
                eventIndicator.classList.add('event-marker'); // Use a marker instead of title
                eventIndicator.innerText = `${dayEvents.length} Event(s)`;
                daySquare.appendChild(eventIndicator);
            }

            daySquare.onclick = () => openModal(dayString);
        } else {
            daySquare.classList.add('padding');
        }
        calendar.appendChild(daySquare);
    }
}

function openModal(date) {
    clickedDate = date;
    document.getElementById('modalDateTitle').innerText = `Events: ${date}`;
    
    const adminForm = document.getElementById('admin-only-form');
    if (currentUser.isLoggedIn) {
        adminForm.classList.remove('hidden');
        document.getElementById('posting-as').innerText = `Posting as: ${currentUser.clubName}`;
    } else {
        adminForm.classList.add('hidden');
    }

    renderEventList();
    document.getElementById('newEventModal').style.display = 'block';
    document.getElementById('modalBackdrop').style.display = 'block';
}

function renderEventList() {
    const list = document.getElementById('existing-events-list');
    const dayEvents = events.filter(e => e.date === clickedDate);
    list.innerHTML = dayEvents.length === 0 ? '<p>No events today.</p>' : '';
    
    dayEvents.forEach(e => {
        const item = document.createElement('div');
        item.className = 'event-item-detailed';
        const canDelete = currentUser.isLoggedIn && (e.club === currentUser.clubName);
        
        item.innerHTML = `
            <div style="flex-grow: 1;">
                <div class="event-item-header">
                    <strong>${e.club}</strong>: ${e.title}
                </div>
                <div class="event-item-desc">${e.description || 'No description provided.'}</div>
            </div>
            ${canDelete ? `<button class="del-btn" onclick="deleteEvent('${e.title}', '${e.date}')">Delete</button>` : ''}
        `;
        list.appendChild(item);
    });
}

function saveEvent() {
    const titleInput = document.getElementById('eventTitleInput');
    const descInput = document.getElementById('eventDescInput'); // Get description
    
    if (titleInput.value) {
        events.push({ 
            date: clickedDate, 
            title: titleInput.value, 
            description: descInput.value, // Save description
            club: currentUser.clubName 
        });
        localStorage.setItem('clubEvents', JSON.stringify(events));
        titleInput.value = '';
        descInput.value = ''; // Clear description
        renderEventList();
        load();
    }
}

function deleteEvent(title, date) {
    // Filter out the specific event
    events = events.filter(e => !(e.title === title && e.date === date));
    localStorage.setItem('clubEvents', JSON.stringify(events));
    renderEventList();
    load();
}

function closeModal() {
    document.getElementById('newEventModal').style.display = 'none';
    document.getElementById('modalBackdrop').style.display = 'none';
}

function closeAllModals() {
    closeModal();
    closeLoginModal();
}

document.getElementById('backButton').onclick = () => { nav--; load(); };
document.getElementById('nextButton').onclick = () => { nav++; load(); };

load();

// Add this at the very bottom of script.js or inside an init function
function initJumpToDate() {
    const monthSelect = document.getElementById('jumpMonth');
    const yearSelect = document.getElementById('jumpYear');
    const currentYear = new Date().getFullYear();

    // Populate Months
    const monthNames = ["January", "February", "March", "April", "May", "June", 
                        "July", "August", "September", "October", "November", "December"];
    
    monthNames.forEach((name, index) => {
        let opt = document.createElement('option');
        opt.value = index;
        opt.innerHTML = name;
        if (index === new Date().getMonth()) opt.selected = true;
        monthSelect.appendChild(opt);
    });

    // Populate Years (e.g., 5 years back to 10 years ahead)
    for (let i = currentYear - 5; i <= currentYear + 10; i++) {
        let opt = document.createElement('option');
        opt.value = i;
        opt.innerHTML = i;
        if (i === currentYear) opt.selected = true;
        yearSelect.appendChild(opt);
    }
}

// Function to handle the "Go" button
function jumpToDate() {
    const selectedMonth = parseInt(document.getElementById('jumpMonth').value);
    const selectedYear = parseInt(document.getElementById('jumpYear').value);
    
    const now = new Date();
    // Calculate the difference in months between "now" and the "selected date"
    // This updates the global 'nav' variable your code uses
    nav = (selectedYear - now.getFullYear()) * 12 + (selectedMonth - now.getMonth());
    
    load();
}

// Call the initializer
initJumpToDate();
