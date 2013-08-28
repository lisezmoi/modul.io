modul.io API
============

## Modul

### modul.id

The modul id (e.g. `'arthur/hal_9000'`).

### modul.context

The Canvas 2D Context of the modul. It is a regular [Canvas.getContext('2d')](https://developer.mozilla.org/en/HTML/Canvas) object with dimensions of 50x50 pixels.

### modul.move( direction )

Move the modul in a direction. Direction must be one of these: `"top"`, `"right"`, `"bottom"`, `"left"`.

### modul.coordinates()

Get the modul coordinates, as a `[x, y]` Array.

### modul.dimensions()

Returns the modul dimensions, as a `[width, height]` Array.

### modul.uptime()

Returns the number of milliseconds since the modul has been connected to the world, or `false` if the modul is not connected.

## Modul events

### modul.on( 'message', function( fromModul, message ) )

Receive a `message` and the modul where it comes (`fromModul`). A message can be any JavaScript object.

## External Modul

This special modul object is returned by methods like modul.sonar().
It is similar to the Modul object, but very restricted.

### extModul.id

The modul id (e.g. `'arthur/hal_9000'`).

### extModul.image()

Returns the current avatar of the external modul. It is a simple [ImageData](https://developer.mozilla.org/en-US/docs/Web/API/ImageData) object.

### extModul.send( message )

Sends a message to the external modul. The targetted modul can listen to incoming message with the `message` event.

### extModul.coordinates()

Get the modul coordinates, as a `[x, y]` Array.

## UI

### ui.button( name, action )

Creates and returns a `Button` object. You need to add it to a `ButtonsPanel`.

The `name` (`string`) is used for the button label.

The `action` (`function`) is triggered when the button is clicked. If the function takes params, they will be requested to the user when he clicks (a simple `window.prompt()`), and passed as `string` to the function.

#### Button: button.label( [label] )

Change the label of a button if a `label` is provided, otherwise returns the current label.

### ui.buttonsPanel( name, [buttons] )

Creates and returns a `ButtonsPanel` object, which is a container for buttons. When called, the new panel is automatically added on the interface.

The `name` (`string`) parameter is used for the panel label.

The `buttons` Array is optional, and could contain a list of `Button`s.

The returned `ButtonsPanel` object has a `add(button)` method wich can be used to add a button after its creation.

### ui.log( message )

Log a message in the main Console panel.

## World

### world.dimensions()

Returns the world dimensions, as a `[width, height]` Array.

## World events

### world.on( 'interval', function( date ) )

The world `interval` event is triggered once per second. The parameter is a `Date` object of the current world time.
