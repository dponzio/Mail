document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  //document.querySelector('.btn-primary').addEventListener('click', send_email);
  document.addEventListener('click', event => {

    // Find what was clicked on
    const element = event.target;

    // If hide
    if (element.className === 'hide') {
        // element.parentElement.style.animationPlayState = 'running';
        // element.parentElement.addEventList
    }
  });
  email_div = document.querySelector('#emails-view');

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Reset mailbox
  email_div.innerHTML = '';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;


  let path = '/emails/' + mailbox;
  fetch(path)
  .then(response => response.json())
  .then(emails => {
      // Print emails so we can confirm stuff in console
      console.log(emails);

      //Show response in the emails_div
      for (var key in emails) {
        let backgroundColor = 'white';

        if (emails[key].read === true) {
            backgroundColor = '#F8F8F8'
        }

        // ### INBOX VIEW ###
        let content = `<div class="email" data-id="${emails[key].id}" style="background-color: ${backgroundColor};">
                            <div class="column">${emails[key].sender}</div>
                            <div class="column">${emails[key].subject}</div>
                            <div class="column column-end">${emails[key].timestamp}</div>
                       </div>`;
        email_div.innerHTML = email_div.innerHTML + content;
      }

      document.querySelectorAll('.email').forEach(email => {
          email.addEventListener('click', view_email);
      })

  });
}

function send_email() {
  // POST request to /emails, passing in values for recipients, subject, and body.
  // Once the email has been sent, load the user’s sent mailbox.
  let recipients = document.querySelector('#compose-recipients').value;
  let subject = document.querySelector('#compose-subject').value;
  let body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(email => {
      // Print result
      console.log(email)
  });

  load_mailbox('sent');
  return false;
}

function view_email(email) {
    let targetEmail = '';
    let path = '';
    if (email.target.classList.contains('email')) {
        targetEmail = email.target;
        path ='/emails/' + targetEmail.dataset.id;
    } else if (email.target.classList.contains('column')) {
        targetEmail = email.target.parentElement;
        path ='/emails/' + targetEmail.dataset.id;
    }

    fetch(path)
    .then(response => response.json())
    .then(email => {
        // Mark email as read:
        read_email(email.id);

        let archived = 'Archive';
        if (email.archived === true) {
            archived = 'Unarchive';
        }

        email_div.innerHTML = `<div>
                            <div><b>From: </b>${email.sender}</div>
                            <div><b>To: </b>${email.recipients}</div>
                            <div><b>Subject: </b>${email.subject}</div>
                            <div><b>Timestamp: </b> ${email.timestamp}</div>
                            <button class="btn btn-sm btn-outline-primary" id="reply">Reply</button>
                            <button class="btn btn-sm btn-outline-primary" id="archive">${archived}</button>
                            <hr>
                            <div>${email.body}</div>
                       </div>`;

        document.querySelector('#archive').addEventListener('click', event => {
            archive_email(email.id, !email.archived);
            load_mailbox('inbox');
        });

        document.querySelector('#reply').addEventListener('click', button => {
            reply_email(email.id);
        });
    });
}

function read_email (id) {
    let path = '/emails/' + id;
    fetch(path, {
      method: 'PUT',
      body: JSON.stringify({
          read: true
      })
    })
}

function archive_email (id, archiveIt) {
    console.log(id, archiveIt);

    let path = '/emails/' + id;
    fetch(path, {
      method: 'PUT',
      body: JSON.stringify({
          archived: archiveIt
      })
    })
    .then(result => {
        // Print result
        console.log(result);
    });

    return false;
}

function reply_email (id) {
    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    let path ='/emails/' + id;
    fetch(path)
    .then(response => response.json())
    .then(email => {
        // Debug
        document.querySelector('#compose-recipients').value = email.sender;
        document.querySelector('#compose-subject').value = 'Re: ' + email.subject;
        bodyText = document.querySelector('#compose-body');
        bodyText.value = `\n\n----\nOn ${email.timestamp}, ${email.sender} wrote: "${email.body}"`;
        bodyText.focus();
        bodyText.setSelectionRange(0,0);
        bodyText.scrollTop = 0;
    });
    return false;
}

