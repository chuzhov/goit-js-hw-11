import './css/styles.css';
import toastr from "toastr";
import './css/toastr.css';
import axios from 'axios';
import SimpleLightbox from "simplelightbox";
import "simplelightbox/dist/simple-lightbox.min.css";

let lightbox = new SimpleLightbox('.gallery a', { captions: true });

const refs = {
    submitQuery : document.querySelector("#search-form"),
    imgGallery : document.querySelector("div.gallery"),
    loadMoreBtn : document.querySelector("button.load-more"),
}

const addNewPicturesGear = {
    types: ["loadMoreBtn", "infiniteScroll"],
    current: "loadMoreBtn",
}

const observerOptions = {
    root: null,
    rootMargin: '100px',
    threshold: 1.0,
  };

let infinite ;
let target;

let currentUserQuery = "";

const PER_PAGE = 40;
let imagesQuantity = 0;
let pagesQuantity = 0;
let currentPageNum = 1

refs.submitQuery.addEventListener("submit", submitQueryHandler);


async function submitQueryHandler(event) {
    event.preventDefault();

    const userQuery = event.target.elements[0].value.trim().replace(" ","+");

    if (userQuery === "") {return false}  // required не повінен пропустити пустий запрос але...
    if (userQuery === currentUserQuery) {return false}
    
    refs.imgGallery.innerHTML=""; 

    currentUserQuery = userQuery;
    currentPageNum = 1;

    addNewPicturesGear.current = event.target.elements[2].value;
    

    if (addNewPicturesGear.current === "loadMoreBtn") {
        refs.loadMoreBtn.addEventListener("click", loadMoreImagesBtn)
    }
    if (addNewPicturesGear.current === "infiniteScroll") {
        
        infinite = new IntersectionObserver( loadMoreImagesInfinite, observerOptions );
    }
    
   
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

        if ( addNewPicturesGear.current === "loadMoreBtn" ) {
            if ( hasMoreImages ) {
                refs.loadMoreBtn.classList.remove("is-hidden");
            } else refs.loadMoreBtn.classList.add("is-hidden");
        }
        if ( addNewPicturesGear.current === "infiniteScroll" ) {
            if ( hasMoreImages ) {
                target = document.querySelector("div.photo-card:last-child");
                infinite.observe(target);
            }
        }
        
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
                    <i class="fa fa-thumbs-o-up" style="font-size:20px"></i>
                    ${item?.likes ?? 0}
                    </p> 
                    <p class="info-item">
                    <i class="fa fa-eye" style="font-size:20px"></i>
                    ${item?.views ?? 0}
                    </p>
                    <p class="info-item">
                    <i class="fa fa-comments-o" style="font-size:20px"></i>
                    ${item?.comments ?? 0}
                    </p>
                    <p class="info-item">
                    <i class="fa fa-download" style="font-size:20px"></i>
                    ${item?.domnloads ?? 0}
                    </p>
                </div>
            </div>`
        ).join("");

        return HTMLstring;

        //<img src="./ico-likes-bw.2b3c6fe8.png" width="20" height="20" alt=""/>
        //<img src="./ico-views-bw.e96f01c1.png" width="20" height="20" alt=""/>

       // <img src="./ico-views-bw.e96f01c1.png" width="20" height="20" alt=""/>
    }

}

function renderGalleryItems(element, HTMLstring) {
    
    element.insertAdjacentHTML("beforeend", HTMLstring);
    lightbox.refresh();  
    
}

function hasMoreImages() {
    if (currentPageNum * PER_PAGE < imagesQuantity)
    return true
    else return false
}

function loadMoreImagesBtn() {
   
    if (hasMoreImages()) {
        currentPageNum+=1      
    }
    else {
        refs.loadMoreBtn.classList.add("is-hidden");
        return;
    }

    axiosFetchPictures(currentUserQuery).then(results => {
        renderGalleryItems( refs.imgGallery, getGalleryItems(results) );
    }).catch((error) => {toastr.error(`Something went wrong: `, error)

    });

    if ( hasMoreImages() ) {
        refs.loadMoreBtn.classList.remove("is-hidden");
    } else refs.loadMoreBtn.classList.add("is-hidden");
 
}

async function loadMoreImagesInfinite(entries, observer) {
    
    if (!entries[0].isIntersecting) return;

    console.log(entries);

    observer.unobserve(entries[0].target);
    if (currentPageNum < pagesQuantity) currentPageNum+=1
    else return;
    
try {
    results = await axiosFetchPictures(currentUserQuery) 
        renderGalleryItems( refs.imgGallery, getGalleryItems(results) );

    if ( hasMoreImages ) 
    {
        target = document.querySelector("div.photo-card:last-child");
        observer.observe(target);
    }
} catch(error) {
   toastr.error(`Something went wrong: `, error)
}



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
