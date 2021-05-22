import axios from 'axios'
import Noty from 'noty'
import { initAdmin } from './admin'
import moment from'moment'

let addToCart = document.querySelectorAll('.add-to-cart')
let cartCounter=document.querySelector('#cartCounter')

function updateCart(pizza) {
    // Server call and add pizza to cart
    axios.post('/update-cart', pizza).then(res => {
        new Noty({
            type: 'success',
            timeout:1000,
            text: 'Item added to cart'
          }).show();
        cartCounter.innerText = res.data.totalQty
    }).catch(err =>{
        new Noty({
            type: 'error',
            timeout:1000,
            text: 'Something went wrong'
          }).show();
    })//post request
}

addToCart.forEach((btn) => {
    btn.addEventListener('click',(e)=>{
        
        // To add pizza to cart
        let pizza = JSON.parse(btn.dataset.pizza)
        updateCart(pizza)
        console.log(pizza)
    })
})

// Remove alert message after X seconds
const alertMsg = document.querySelector('#success-alert')
if(alertMsg) {
    setTimeout(() => {
        alertMsg.remove()
    }, 2000)
}



let statuses = document.querySelectorAll('.status_line')
let hiddenInput = document.querySelector('#hiddenInput')
let order = hiddenInput ? hiddenInput.value : null

order = JSON.parse(order)
let time = document.createElement('small')

function updateStatus(order) {
    statuses.forEach((status) => {
        status.classList.remove('step-completed')
        status.classList.remove('current')
    })
    let stepCompleted = true;
    statuses.forEach((status) => {
       let dataProp = status.dataset.status
       if(stepCompleted) {
            status.classList.add('step-completed')
       }
       if(dataProp === order.status) {
            stepCompleted = false
            time.innerText = moment(order.updatedAt).format('hh:mm A')
            status.appendChild(time)
           if(status.nextElementSibling) {
            status.nextElementSibling.classList.add('current')
           }
       }
    })
}

updateStatus(order);

// Socket
let socket = io()



// Join
if(order) {
    socket.emit('join', `order_${order._id}`)
}
let adminAreaPath = window.location.pathname //Get URl
if(adminAreaPath.includes('admin')) {        //If it includes /admin then join for adminRoom
    initAdmin(socket)
    socket.emit('join', 'adminRoom')
}

socket.on('orderUpdated', (data) => {
    const updatedOrder = { ...order }
    updatedOrder.updatedAt = moment().format()
    updatedOrder.status = data.status
    updateStatus(updatedOrder)
    new Noty({
        type: 'success',
        timeout: 1000,
        text: 'Order updated',
        progressBar: false,
    }).show();
})