const notecontainer = document.querySelector<HTMLDivElement>("#notes");
const inp = document.querySelector<HTMLInputElement>("#inpNotattekst");
const loginBtn = document.querySelector<HTMLButtonElement>("#loginBtn");
const form = document.querySelector<HTMLFormElement>("#popup");
const email = document.querySelector<HTMLInputElement>("#email");
const password = document.querySelector<HTMLInputElement>("#password");
const opretBtn = document.querySelector<HTMLButtonElement>("#opretBruger");
const opretform = document.querySelector<HTMLFormElement>("#opretform");
const opretEmail = document.querySelector<HTMLInputElement>("#opretEmail");
const opretPassword = document.querySelector<HTMLInputElement>("#opretPassword");
const gentagOpretPassword = document.querySelector<HTMLInputElement>("#gentagOpretPassword");
const tilbage = document.querySelector<HTMLButtonElement>("#tilbage");

inp!.addEventListener("keyup", opretNotat);

let token: string | null = null;
let localId: string | null = null;

const wsurl = "https://notatlist.firebaseio.com";

tilbage!.addEventListener("click", function(){
    form!.style.display = "block";
    opretform!.style.display = "none";
});

opretBtn!.addEventListener("click", function () {
    form!.style.display = "none";
    opretform!.style.display = "block";
});

opretform!.addEventListener("submit", function (e: Event) {
    e.preventDefault();
    if (opretPassword!.value !== gentagOpretPassword!.value) {
        alert("Passwords er ikke ens!");
        return;
    }
    if(opretPassword!.value.length < 6){
        alert("Password skal være større end 5 tegn!");
        return;
    }
    const opretData = {
        email: opretEmail!.value,
        password: opretPassword!.value
    }
    fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyBcsQlAxLSUObImGESjmso6oRTF1lL52ZA`, {
        method: "POST",
        body: JSON.stringify(opretData)
    }).then(function (data) {
        return data.json();
    }).then(function (json) {
        alert("Oprettet bruger!");
        token = json.idToken;
        localId = json.localId;
        document.querySelector("#overlay")!.remove(); kaldWebserviceAlle();

    }).catch(function (error) {
        console.error(error);
    });
})



form!.addEventListener("submit", function (e: Event) {
    e.preventDefault();
    login(email!.value, password!.value).then(function (data) {
        document.querySelector("#overlay")!.remove();
        kaldWebserviceAlle();
    }, function (error) {
        alert(`${error}; Derfor bliver du sendt til bing!`);
        window.location.href = "https://www.bing.com";
    });
});

function opretNotat(e: Event): void {
    if ((e as KeyboardEvent).keyCode === 13) {
        kaldWebserviceOpret((e.target as HTMLInputElement).value)
        inp!.value = "";
    }
}

function kaldWebserviceOpret(inp: string): void {
    const nytnotat: notatData = {
        notat: inp,
        date: new Date()
    };

    fetch(`${wsurl}/users/${localId}/notater.json?auth=${token}`, {
        method: "POST",
        body: JSON.stringify(nytnotat)
    }).then(function () {
        console.log("Ok");
        kaldWebserviceAlle();
    }).catch(function (error) {
        console.error(error);
    });
}
// kaldWebserviceAlle();
function kaldWebserviceAlle(): void {
    fetch(`${wsurl}/users/${localId}/notater.json?auth=${token}`, {
        method: "GET"
    }).then(function (response) {
        return response.json();
    }).then(function (json) {
        udskrivNotater(json);
    }).catch(function (error) {
        console.error(error);
    });
}


interface notatType {
    [id: string]: notatData
}

interface notatData {
    notat: string,
    date: Date
}

function udskrivNotater(noterJson: notatType): void {
    notecontainer!.innerHTML = "";
    if (!noterJson)
        return;

    for (let id of Object.keys(noterJson)) {

        let notediv = document.createElement("div");
        notediv.className = "note";

        let p = document.createElement("p");
        p.setAttribute("data-id", id);
        p.setAttribute("data-date", noterJson[id].date.toString());
        p.setAttribute("contenteditable", "true");
        p.onkeydown = function (e: KeyboardEvent) {
            if (e.keyCode === 13) {
                e.preventDefault();
                kaldWebserviceRet(this as HTMLParagraphElement);
            }
        }
        p.innerHTML = noterJson[id].notat;

        let dateText = document.createElement("p");
        let date = new Date(noterJson[id].date.toString());
        dateText.innerText = date.toLocaleString()

        let sletdiv = document.createElement("div");
        sletdiv.setAttribute("data-id", id);
        sletdiv.innerHTML = " &#9746";
        sletdiv.onclick = function () {
            kaldWebserviceSlet(id);
        }

        notediv.appendChild(p);
        notediv.appendChild(dateText);
        notediv.appendChild(sletdiv);

        notecontainer!.appendChild(notediv);

    }
}

function kaldWebserviceSlet(id: string): void {
    fetch(`${wsurl}/users/${localId}/notater/${id}.json?auth=${token}`, {
        method: "DELETE"
    }).then(function () {
        kaldWebserviceAlle();
    }).catch(function (error) {
        console.error(error);
    });
}

function kaldWebserviceRet(p: HTMLParagraphElement): void {
    let notatid = p.getAttribute("data-id");
    let notatdate = p.getAttribute("data-date");
    let notattxt = p.innerHTML.replace("<br>", "");

    let rettetnotat: notatData = {
        notat: notattxt,
        date: new Date(notatdate!)
    };

    fetch(`${wsurl}/users/${localId}/notater/${notatid}.json/?auth=${token}`, {
        method: "PUT",
        body: JSON.stringify(rettetnotat)
    }).then(function () {
        kaldWebserviceAlle();
    }).catch(function (error) {
        console.error(error);
    })
}

function login(email: string, password: string) {
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
            localId = json.localId;
            resolve();
        }).catch(function () {
            reject();
        });
    });
}