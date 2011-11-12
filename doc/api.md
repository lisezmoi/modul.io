modul.io API
============

## modul

### modul.getCoordinates()

Get the modul coordinates, as a `[x, y]` Array.

### modul.getContext()

Get the 2D Context of the modul. It is a regular [Canvas.getContext('2d')](https://developer.mozilla.org/en/HTML/Canvas) object of dimensions 50x50 pixels.

### modul.move(direction)

Move the modul in a direction. Direction must be one of these: `"top"`, `"right"`, `"bottom"`, `"left"`.

### modul.getDimensions()

Returns the modul dimensions, as a `[width, height]` Array.

### modul.getUpTime()

Returns the number of milliseconds since the modul has been connected to the world, or `false` if the modul is not connected.

## ui

### ui.Button(name, action)

The `button` object can be instancied to create a new button on the interface.

The `name` (`string`) is used for the button label.

The `action` (`function`) is triggered when the button is clicked. If the function takes params, they will be requested to the user when he clicks (a simple `window.prompt()`), and passed as `string` to the function.

### ui.Button.setLabel(label)

Change the label of a button.

### ui.ButtonsPanel(name, [buttons])

The `ButtonsPanel` is a container for buttons. When instancied, it creates a new panel on the interface.

The `name` (`string`) parameter is used for the panel label.

The `buttons` Array is optional, and could contain a list of `Button`s.

The instanciated object has a `add(button)` method wich can be used to add a button after the instanciation.

### ui.log(message)

Log a message in the main Console panel.

## world

### world.onInterval()

Add a function to the world interval. The world interval is triggered once per second.

### world.getDimensions()

Returns the world dimensions, as a `[width, height]` Array.
