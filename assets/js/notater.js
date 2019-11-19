"use strict";
const notecontainer = document.querySelector("#notes");
const inp = document.querySelector("#inpNotattekst");
const loginBtn = document.querySelector("#loginBtn");
const form = document.querySelector("#popup");
const email = document.querySelector("#email");
const password = document.querySelector("#password");
const opretBtn = document.querySelector("#opretBruger");
const opretform = document.querySelector("#opretform");
const opretEmail = document.querySelector("#opretEmail");
const opretPassword = document.querySelector("#opretPassword");
const gentagOpretPassword = document.querySelector("#gentagOpretPassword");
inp.addEventListener("keyup", opretNotat);
let token = null;
const wsurl = "https://notatlist.firebaseio.com";
opretBtn.addEventListener("click", function () {
    form.style.display = "none";
    opretform.style.display = "block";
});
opretform.addEventListener("submit", function (e) {
    e.preventDefault();
    if (opretPassword.value !== gentagOpretPassword.value) {
        alert("Passwords er ikke ens!");
        return;
    }
    const opretData = {
        email: opretEmail.value,
        password: opretPassword.value
    };
    //https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyBcsQlAxLSUObImGESjmso6oRTF1lL52ZA
    fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyBcsQlAxLSUObImGESjmso6oRTF1lL52ZA`, {
        method: "POST",
        body: JSON.stringify(opretData)
    }).then(function (data) {
        return data.json();
    }).then(function (json) {
        alert("Oprettet bruger!");
        token = json.idToken;
        document.querySelector("#overlay").remove();
        kaldWebserviceAlle();
    }).catch(function (error) {
        console.error(error);
    });
});
form.addEventListener("submit", function (e) {
    e.preventDefault();
    login(email.value, password.value).then(function (data) {
        document.querySelector("#overlay").remove();
        kaldWebserviceAlle();
    }, function (error) {
        alert(`${error}; Derfor bliver du sendt til bing!`);
        window.location.href = "https://www.bing.com";
    });
});
function opretNotat(e) {
    if (e.keyCode === 13) {
        kaldWebserviceOpret(e.target.value);
        inp.value = "";
    }
}
function kaldWebserviceOpret(inp) {
    const nytnotat = {
        notat: inp,
        date: new Date(),
        email: token
    };
    fetch(`${wsurl}/notater.json`, {
        method: "POST",
        body: JSON.stringify(nytnotat)
    }).then(function () {
        console.log("Ok");
        kaldWebserviceAlle();
    }).catch(function (error) {
        console.error(error);
    });
}
kaldWebserviceAlle();
function kaldWebserviceAlle() {
    fetch(`${wsurl}/notater.json`, {
        method: "GET"
    }).then(function (response) {
        return response.json();
    }).then(function (json) {
        udskrivNotater(json);
    }).catch(function (error) {
        console.error(error);
    });
}
function udskrivNotater(noterJson) {
    notecontainer.innerHTML = "";
    if (!noterJson)
        return;
    for (let id of Object.keys(noterJson)) {
        let notediv = document.createElement("div");
        notediv.className = "note";
        let p = document.createElement("p");
        p.setAttribute("data-id", id);
        p.setAttribute("data-date", noterJson[id].date.toString());
        p.setAttribute("contenteditable", "true");
        p.onkeydown = function (e) {
            if (e.keyCode === 13) {
                e.preventDefault();
                kaldWebserviceRet(this);
            }
        };
        p.innerHTML = noterJson[id].notat;
        let dateText = document.createElement("p");
        let date = new Date(noterJson[id].date.toString());
        dateText.innerText = date.toLocaleString();
        let sletdiv = document.createElement("div");
        sletdiv.setAttribute("data-id", id);
        sletdiv.innerHTML = " &#9746";
        sletdiv.onclick = function () {
            kaldWebserviceSlet(id);
        };
        notediv.appendChild(p);
        notediv.appendChild(dateText);
        notediv.appendChild(sletdiv);
        notecontainer.appendChild(notediv);
    }
}
function kaldWebserviceSlet(id) {
    fetch(`${wsurl}/notater/${id}.json`, {
        method: "DELETE"
    }).then(function () {
        kaldWebserviceAlle();
    }).catch(function (error) {
        console.error(error);
    });
}
function kaldWebserviceRet(p) {
    let notatid = p.getAttribute("data-id");
    let notatdate = p.getAttribute("data-date");
    let notattxt = p.innerHTML.replace("<br>", "");
    let rettetnotat = {
        notat: notattxt,
        date: new Date(notatdate),
        email: token
    };
    fetch(`${wsurl}/notater/${notatid}.json`, {
        method: "PUT",
        body: JSON.stringify(rettetnotat)
    }).then(function () {
        kaldWebserviceAlle();
    }).catch(function (error) {
        console.error(error);
    });
}
function login(email, password) {
    return new Promise((resolve, reject) => {
        fetch("https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyBcsQlAxLSUObImGESjmso6oRTF1lL52ZA", {
            method: 'POST',
            body: JSON.stringify({
                email,
                password,
                returnSecureToken: true
            })
        }).then(function (response) {
            if (response.status === 400) {
                return reject("Wrong email or password!");
            }
            return response.json();
        }).then(function (json) {
            token = json.idToken;
            resolve();
        }).catch(function () {
            reject();
        });
    });
}