// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyDXe0zfGgGolZAj533C40_-uQH354RcJtY",
    authDomain: "photo-share-51ede.firebaseapp.com",
    databaseURL: "https://photo-share-51ede.firebaseio.com",
    projectId: "photo-share-51ede",
    storageBucket: "photo-share-51ede.appspot.com",
    messagingSenderId: "83785952855",
    appId: "1:83785952855:web:e24801ddb91491c7fefd12",
    measurementId: "G-9X4EJY5XJG"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();

// Upload button
const uploadButton = document.querySelector('#upload-button');
// Progress bar
const progressBar = document.querySelector('progress');
// imageFile is global so we can access it after it uploads
let imageFile

// Event listener for if upload image button is clicked and a file has been selected
uploadButton.addEventListener('change', (e) => {

    // Access the chosen file through the event
    let file = e.target.files[0];

    // Define a var just for the name of the file
    let name = e.target.files[0].name;

    // Create a storage reference to the database using the name of the chosen file
    let storageRef = firebase.storage().ref(name);

    // Attach the put method to the storageRef 
    storageRef.put(file).on('state_changed',
        snapshot => {
            let percentage = Number(snapshot.bytesTransferred / snapshot.totalBytes * 100).toFixed(0);
            progressBar.value = percentage;
        },
        error => {
            console.error(error.message);
        },
        () => {

            // Once upload is complete make a second request to get the download URL
            storageRef.put(file).snapshot.ref.getDownloadURL()
                .then(url => {
                    console.log("Uploaded to Storage: ", url);

                    // Every time we upload a image we also need to add a reference to the database
                    firebase.firestore().collection('images').
                        add({
                            url: url,
                            filepath: file.name,
                            timestamp: firebase.firestore.Timestamp.now()
                        })
                        .then(success => {
                            console.log("Saved to Firestore: ", url);
                        })
                        .catch(error => {
                            console.error(error);
                        });

                    // Reset the progress bar to zero percent after one second
                    setTimeout(() => {
                        progressBar.removeAttribute('value')
                    }, 1000)
                });
        });
});

// listen to database in the images collection. Loop through returned data to create image elements
firebase.firestore().collection('images').onSnapshot(snapshot => {

    // Clear images div content
    // document.querySelector('#images').innerHtml = ""  // TODO: Not working
    while (document.querySelector('#images').lastElementChild) {
        document.querySelector('#images').removeChild((document.querySelector('#images').lastElementChild))
    }

    snapshot.forEach(each => {
        console.log("Reading urls: ", each.data().url);

        let div = document.createElement('dev');
        let image = document.createElement('img');
        image.setAttribute('src', each.data().url);
        div.append(image);
        document.querySelector('#images').append(div);
    });
});

// Remove all photos
document.querySelector('#clear').addEventListener('click', e => {
    firebase.firestore().collection('images')
        .get()
        .then(snapshot => {
            snapshot.forEach(item => {

                firebase.firestore().collection('images').doc(item.id)
                    .delete()
                    .then(() => {
                        console.log("Successfully deleted from Firestore: ", item.data().url);

                        let storageRef = firebase.storage().ref();
                        storageRef.child(item.data().filepath).delete()
                            .then(() => {
                                console.log("Successfully deleted from Storage: ", item.data().filepath);
                            })
                            .catch(error => {
                                console.error("Error deleting from Storage: ", error);
                            });
                    })
                    .catch(error => {
                        console.error("Error removing document: ", error);
                    });
            });
        })
        .catch(error => {
            console.error("Error getting documents");
        });
});