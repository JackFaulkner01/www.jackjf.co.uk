var serial = {};

(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', event => {
        let connectButton = document.querySelector('#connect');
        let statusDisplay = document.querySelector('#status');
        let turnOnButton = document.querySelector('#turnOn');
        let turnOffButton = document.querySelector('#turnOff');
        let fileInput = document.querySelector('#file');
        let uploadFileButton = document.querySelector('#uploadFile');
        let fileReader = new FileReader();
        let fileLines = [];
        let port;

        turnOnButton.addEventListener('click', function() {
            if (port) {
                port.send(new TextEncoder().encode('turnOnLED'));
		        statusDisplay.textContent = '';
            } else {
                statusDisplay.textContent = 'No Pico Connected';
            }
        });

        turnOffButton.addEventListener('click', function() {
            if (port) {
                port.send(new TextEncoder().encode('turnOffLED'));
		        statusDisplay.textContent = '';
            } else {
                statusDisplay.textContent = 'No Pico Connected';
            }
        });

        connectButton.addEventListener('click', function() {
            if (port) {
                port.disconnect();
                connectButton.textContent = 'Connect to Pico';
                statusDisplay.textContent = '';
                port = null;
            } else {
                serial.requestPort().then(selectedPort => {
                    port = selectedPort;
                    port.connect().then(() => {
                        statusDisplay.textContent = '';
                        connectButton.textContent = 'Disconnect from Pico';

                        port.onReceive = data => {
			                statusDisplay.textContent = new TextDecoder().decode(data);
                        };

                        port.onReceiveError = error => {
                            statusDisplay.textContent = new TextDecoder().decode(error);
                        };
                    }, error => {
                        statusDisplay.textContent = error;
                    });
                }).catch(error => {
                    statusDisplay.textContent = error;
                });
            }
        });

        fileInput.addEventListener('change', (e) => {
            fileReader.readAsText(e.target.files[0]);
            fileReader.onload = () => {

                fileLines = fileReader.result.split(String.fromCharCode(10));
            }
        })

        uploadFileButton.addEventListener('click', function() {
            if (port && fileRead) {
		        port.send(new TextEncoder().encode('start_py_file_upload'));
                for (let i = 0; i < fileLines.length; i++) {
                    if (fileLines[i].length > 0) {
                        port.send(new TextEncoder().encode(fileLines[i]));
                    }
                }
		        port.send(new TextEncoder().encode('end_py_file_upload'));
		        statusDisplay.textContent = '';
            } else if (port) {
                statusDisplay.textContent = 'No File to Upload';
            } else {
                statusDisplay.textContent = 'No Pico Connected';
            }
        });
    });

    serial.Port = function(device) {
        this.device_ = device;
        this.interfaceNumber = 0;
        this.endpointIn = 0;
        this.endpointOut = 0;
    };

    serial.getPorts = function() {
        return navigator.usb.getDevices().then(devices => {
            return devices.map(device => new serial.Port(device));
        });
    };

    serial.requestPort = function() {
        const filters = [
            { 'vendorId': 0x2e8a }, // Raspberry Pi
        ];
        return navigator.usb.requestDevice({ 'filters': filters }).then(
            device => new serial.Port(device)
        );
    };

    serial.Port.prototype.connect = function() {
        let readLoop = () => {
        this.device_.transferIn(this.endpointIn, 64).then(result => {
            this.onReceive(result.data);
            readLoop();
        }, error => {
            this.onReceiveError(error);
        });
    };

    serial.Port.prototype.send = function(data) {
        return this.device_.transferOut(this.endpointOut, data);
    };

    return this.device_.open()
        .then(() => {
            if (this.device_.configuration === null) {
                return this.device_.selectConfiguration(1);
            }
        })
        .then(() => {
            var interfaces = this.device_.configuration.interfaces;
            interfaces.forEach(element => {
                element.alternates.forEach(elementalt => {
                    if (elementalt.interfaceClass == 0xFF) {
                        this.interfaceNumber = element.interfaceNumber;
                        elementalt.endpoints.forEach(elementendpoint => {
                            if (elementendpoint.direction == "out") {
                                this.endpointOut = elementendpoint.endpointNumber;
                            }
                            if (elementendpoint.direction == "in") {
                                this.endpointIn = elementendpoint.endpointNumber;
                            }
                        })
                    }
                })
            })
        })
        .then(() => this.device_.claimInterface(this.interfaceNumber))
        .then(() => this.device_.selectAlternateInterface(this.interfaceNumber, 0))
        .then(() => this.device_.controlTransferOut({
            'requestType': 'class',
            'recipient': 'interface',
            'request': 0x22,
            'value': 0x01,
            'index': this.interfaceNumber}))
        .then(() => {
            readLoop();
        });
    };

    serial.Port.prototype.disconnect = function() {
        return this.device_.controlTransferOut({
                'requestType': 'class',
                'recipient': 'interface',
                'request': 0x22,
                'value': 0x00,
                'index': this.interfaceNumber})
            .then(() => this.device_.close());
    };
})();
