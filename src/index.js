import './css/styles.css';
import toastr from "toastr";
import './css/toastr.css';
import axios from 'axios';
import SimpleLightbox from "simplelightbox";
import "simplelightbox/dist/simple-lightbox.min.css";

let lightbox = new SimpleLightbox('.gallery a', { captions: true, captionsData: "alt", captionDelay: 250 });

const refs = {
    submitQuery : document.querySelector("#search-form"),
    imgGallery : document.querySelector("div.gallery"),
    loadMoreBtn : document.querySelector("button.load-more"),
}

const addNewPicturesGear = {
    types: ["loadMoreBtn", "endlessScroll"],
    current: "loadMoreBtn",
}

console.log(addNewPicturesGear.current);

let currentUserQuery = "";

const PER_PAGE = 40;
let imagesQuantity = 0;
let pagesQuantity = 0;
let currentPageNum = 1

refs.loadMoreBtn.classList.add("is-hidden");
refs.submitQuery.addEventListener("submit", submitQueryHandler);
refs.loadMoreBtn.addEventListener("click", loadMoreImages);

async function submitQueryHandler(event) {
    event.preventDefault();

    const userQuery = event.target.elements[0].value.trim().replace(" ","+");

    if (userQuery === "") {return false}  // required не повінен пропустити пустий запрос але...
    if (userQuery === currentUserQuery) {return false}
    
    refs.imgGallery.innerHTML=""; 
    refs.loadMoreBtn.classList.add("is-hidden");

    currentUserQuery = userQuery;
    currentPageNum = 1;
    // try {
    //     const data = await axiosFetchPictures(currentUserQuery);
    //     console.log("data ", data);
    // }


    // try {
    //     const {results} = await axiosFetchPictures(currentUserQuery);
    //     console.log(results);
    //     if (results.totalHits === 0) {
    //         toastr.error("Your fantasy has no limits! </br> Sorry, there are no images matching your search query");
    //         return;
    //     }
        
    //     renderGalleryItems( refs.imgGallery, getGalleryItems(results) );

    // } catch (error) {
    //     toastr.error("Run-time error: ", error);
    // } 

    axiosFetchPictures(currentUserQuery)
    .then(results => {
        
        if (results.totalHits === 0) {
            toastr.error("Your fantasy has no limits! </br> Sorry, there are no images matching your search query");
            return;
        }

        imagesQuantity = results.totalHits;
        pagesQuantity = Math.ceil( imagesQuantity / PER_PAGE );

        toastr.success(`Great choice! We found ${imagesQuantity} images.`);

        renderGalleryItems( refs.imgGallery, getGalleryItems(results) );
        
    }).
    catch((error)=> toastr.error(`Something went wrong: `, error));
    
}

function getGalleryItems({hits}) {
    let HTMLstring="";

    if (hits.length > 0) {
        HTMLstring = hits.map( item => `<div class="photo-card">
            <a class="gallery__link" href="${item?.largeImageURL}">
                <img src="${item.webformatURL}" alt="" title="${item.tags}" loading="lazy" width="284" height="189"/>
            </a>
                <div class="info">
                    <p class="info-item">
                    <img src="img/ico-views-bw.png" width="20" height="20" alt=""/>${item?.likes ?? 0}
                    </p>
                    <p class="info-item">
                    <b>Views
                    </b>${item?.views ?? 0}
                    </p>
                    <p class="info-item">
                    <b>Comments
                    </b>${item?.comments ?? 0}
                    </p>
                    <p class="info-item">
                    <b>Downloads
                    </b>${item?.domnloads ?? 0}
                    </p>
                </div>
            </div>`
        ).join("");

        return HTMLstring;
    }

}

function renderGalleryItems(element, HTMLstring) {
    
    element.insertAdjacentHTML("beforeend", HTMLstring);
    lightbox.refresh();
    
    if (currentPageNum * PER_PAGE < imagesQuantity) {
        refs.loadMoreBtn.classList.remove("is-hidden");
    } else refs.loadMoreBtn.classList.add("is-hidden");
}

function loadMoreImages() {
   
    if (currentPageNum <= pagesQuantity) currentPageNum+=1
    else return;

    axiosFetchPictures(currentUserQuery).then(results => {
        renderGalleryItems( refs.imgGallery, getGalleryItems(results) );
    });
    
}

async function axiosFetchPictures(q) {

    const hostURL = 'https://pixabay.com/api/';
    //axios.defaults.headers.common['Authorization'] = '31408282-c2e36d8dbb4ab0017da4fad76';
    const API_KEY = '31408282-c2e36d8dbb4ab0017da4fad76';
    
     const searchParams = {
        q,
        image_type: 'photo',
        orientation: 'horizontal',
        safesearch: true,
        page: currentPageNum,
        per_page: PER_PAGE,
    };
    
    const url = `${hostURL}?key=${API_KEY}&q=${searchParams.q}&page=${currentPageNum}&per_page=${searchParams.per_page}`

        try {    
           const { data } = await axios.get(url);
           return data;
    
        } catch (err) {
            console.log(err);
        } 
    }
