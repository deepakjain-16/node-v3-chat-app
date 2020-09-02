const socket = io()

//Elements
const $myForm = document.querySelector('#myForm')
const $myFormInput = $myForm.querySelector('input')
const $myFormButton = $myForm.querySelector('button')
const $sendLocation = document.querySelector('#sendLocation')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const {username,room} =  Qs.parse(location.search,{ignoreQueryPrefix:true})

const autoScroll = () =>{
	//new message element 
	const $newMessage = $messages.lastElementChild

	//height of the new message
	const newMessageHeight = $newMessage.offsetHeight + parseInt(getComputedStyle($newMessage).marginBottom)

	//visible height
	const visibleHeight = $messages.offsetHeight

	//height of message container
	const containerHeight = $messages.scrollHeight

	//how far have i scrolled?
	const scrolledoffset = $messages.scrollTop + visibleHeight

	if(containerHeight - newMessageHeight <= scrolledoffset){
		$messages.scrollTop = $messages.scrollHeight
	}
}

//listening for a event to occur
socket.on('message',(data)=>{
	const html = Mustache.render(messageTemplate,{
		username:data.username,
		message:data.text,
		createdAt : moment(data.createdAt).format('h:m a') 
	})
	$messages.insertAdjacentHTML('beforeend',html)
	autoScroll()
})

socket.on('locationMessage',(data)=>{
	const html = Mustache.render(locationTemplate,{
		username:data.username,
		url:data.url,
		createdAt : moment(data.createdAt).format('h:m a') 
	})
	$messages.insertAdjacentHTML('beforeend',html)
	autoScroll()
})

socket.on('roomData',({room,users})=>{
	const html = Mustache.render(sidebarTemplate,{
		room,
		users
	})
	document.querySelector('#sidebar').innerHTML = html
})


//emiting events
$myForm.addEventListener('submit',(e)=>{
	e.preventDefault();
	
	$myFormButton.setAttribute('disabled','disabled')
	
	socket.emit('sendMessage',e.target.elements.message.value,(error)=>{
		$myFormButton.removeAttribute('disabled')
		$myFormInput.value = ''
		$myFormInput.focus()
		
		if(error === 'user not found!'){
		alert(error)
		location.href = '/'
		}
		else if(error){
			alert(error)
		}
	})
})

$sendLocation.addEventListener('click',(e)=>{
	if(!navigator.geolocation){
		return alert('Geolocation is not supported by your browser.')
	}
	$sendLocation.setAttribute('disabled','disabled')
	
	navigator.geolocation.getCurrentPosition((position)=>{
		socket.emit('sendLocation',{
			latitude:position.coords.latitude,
			longitude:position.coords.longitude
		},(error)=>{
			$sendLocation.removeAttribute('disabled')
			if(error === 'user not found!'){
				alert(error)
				location.href = '/'
				}
				else if(error){
					alert(error)
				}
		})
	})
})

socket.emit('join',{username,room},(error)=>{
	if(error){
		alert(error)
		location.href = '/'
	}
})