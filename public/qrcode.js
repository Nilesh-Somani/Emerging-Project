document.getElementById("student-info").style.display = 'block';
const navLinks = document.querySelectorAll('.navbar .section');
navLinks.forEach(link => link.addEventListener('click', (event) => {
  event.preventDefault();
  navLinks.forEach(link => link.classList.remove('active'));
  link.classList.add('active');
  if (link.classList.contains('student')) {
    document.getElementById("qr-scanner").style.display = 'none';
    document.getElementById("qr-generator").style.display = 'none';
    document.getElementById("student-info").style.display = 'block';
    scanner.clear();
    let imgBox = document.getElementById("imgBox");
    let qrImage = document.getElementById("qrImage");
    qrImage.src = "";
    imgBox.classList.remove("show-img");
    imgBox.style.display = "none";
  } else if (link.classList.contains('scanner')) {
    document.getElementById("qr-scanner").style.display = 'block';
    document.getElementById("qr-generator").style.display = 'none';
    document.getElementById("student-info").style.display = 'none';
    scanner.render(success, error);
    let imgBox = document.getElementById("imgBox");
    let qrImage = document.getElementById("qrImage");
    qrImage.src = "";
    imgBox.classList.remove("show-img");
    imgBox.style.display = "none";
  } else if (link.classList.contains('generator')) {
    document.getElementById("qr-scanner").style.display = 'none';
    document.getElementById("qr-generator").style.display = 'block';
    document.getElementById("student-info").style.display = 'none';
    scanner.clear();
    let qrImage = document.getElementById("qrImage");
    qrImage.src = "";
  }
}));
const profileIcon = document.querySelector('.profile-icon');
const profileDropdown = document.querySelector('.profile-dropdown');
profileIcon.addEventListener('click', () => {
  profileDropdown.classList.toggle('show');
});
const profileContainer = document.querySelector('.profile-container');
profileContainer.addEventListener('mouseleave', () => {
  const profileDropdown = document.querySelector('.profile-dropdown');
  profileDropdown.classList.remove('show');
});
function generateQR() {
  let imgBox = document.getElementById("imgBox");
  let qrImage = document.getElementById("qrImage");
  let selectElement = document.getElementById('gen-uid');
  let selectedOptionValue = selectElement.options[selectElement.selectedIndex].value;
  qrImage.src = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + selectedOptionValue;
  imgBox.classList.add("show-img");
  imgBox.style.display = "block";
}
const scanner = new Html5QrcodeScanner('reader', { qrBox: 250, fps: 20, });
function success(result) {
  document.getElementById("reader").style.display = "none";
  document.getElementById("result-contains").style.display = "block";
  document.getElementById("result").value = result;
  scanner.clear();
}
function error(err) {
}
const scanButton = document.getElementById("rescan");
scanButton.addEventListener("click", () => {
  document.getElementById("reader").style.display = "block";
  document.getElementById("result-contains").style.display = "none";
  document.getElementById("result").value = "";
  scanner.render(success, error);
});

const collapseToggles = document.querySelectorAll('.collapse-toggle');

collapseToggles.forEach(toggle => {
  toggle.addEventListener('click', (event) => {
    const target = event.target.dataset.target;
    const collapseElement = document.getElementById(target);

    if (collapseElement.classList.contains('show')) {
      collapseElement.classList.remove('show');
    } else {
      collapseElement.classList.add('show');
    }
  });
});

$('.collapse-toggle').on('click', function() {
  $('.collapse.show').collapse('hide');
});

