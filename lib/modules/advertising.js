/* ------------------------------------------------------------------
* node-linking - advertising.js
*
* Copyright (c) 2017, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2017-04-27
* ---------------------------------------------------------------- */
'use strict';
const LinkingIEEE754 = require('./ieee754.js');

/* ------------------------------------------------------------------
* Constructor: LinkingAdvertising()
* ---------------------------------------------------------------- */
const LinkingAdvertising = function() {};

/* ------------------------------------------------------------------
* Method: parse(peripheral)
* - buf: `Peripheral` object of the noble)
* ---------------------------------------------------------------- */
LinkingAdvertising.prototype.parse = function(peripheral) {
	let ad = peripheral.advertisement;
	let manu = ad.manufacturerData;
	// Company identifier
	let company_id = manu.readUInt16LE(0);
	let company_name = 'Unknown';
	if(company_id === 0x02E2) {
		company_name = 'NTT docomo';
	}
	// Version
	let version = (manu.readUInt8(2) >>> 4);
	// Vendor identifier
	let vendor_id = ((manu.readUInt16BE(2) >>> 4) & 0b11111111);
	// Individual number
	let indi_num = ((manu.readUInt32BE(3) >>> 8) & (Math.pow(2, 20) - 1));
	// Beacon Data
	let beacon_data_list = [];
	for(let offset=6; offset<manu.length; offset+=2) {
		let beacon_buf = manu.slice(offset, offset + 2);
		// Beacon service data
		if(beacon_buf.length === 2) {
			let beacon_data = this._parseBeaconServiceData(beacon_buf);
			beacon_data_list.push(beacon_data);
		}
	}

	return {
		id                : peripheral.id,
		uuid              : peripheral.uuid,
		address           : peripheral.address,
		localName         : ad.localName,
		serviceUuids      : ad.serviceUuids,
		txPowerLevel      : ad.txPowerLevel,
		rssi              : peripheral.rssi,
		distance          : Math.pow(10, (ad.txPowerLevel - peripheral.rssi) / 20),
		companyId         : company_id,
		companyName       : company_name,
		version           : version,
		vendorId          : vendor_id,
		individualNumber  : indi_num,
		beaconDataList    : beacon_data_list
	};
};

LinkingAdvertising.prototype._parseBeaconServiceData = function(buf) {
	let bufn = buf.readUInt16BE(0);
	let service_id = (bufn >>> 12);
	let n = bufn & 0b0000111111111111;
	let res = {};
	if(service_id === 0) {
		res = {
			name : 'General',
		};
	} else if(service_id === 1) {
		res = {
			//name        : 'Temperature (°C)',
			name        : 'Temperature',
			temperature : LinkingIEEE754.read(n, 1, 4, 7)
		};
	} else if(service_id === 2) {
		res = {
			//name     : 'Humidity (%)',
			name     : 'Humidity',
			humidity : LinkingIEEE754.read(n, 0, 4, 8)
		};
	} else if(service_id === 3) {
		res = {
			//name     : 'Air pressure (hPa)',
			name     : 'Air pressure',
			pressure : LinkingIEEE754.read(n, 0, 5, 7)
		};
	} else if(service_id === 4) {
		res = {
			//name     : 'Remaining battery power (Threshold value or less)',
			name     : 'Remaining battery power',
			chargeRequired : (n & 0b0000100000000000) ? true : false,
			chargeLevel    : Math.min((n & 0b0000011111111111) / 10, 100)
		};
	} else if(service_id === 5) {
		let code = n & 0b0000111111111111;
		let text = '';
		if(code === 0x02) {
			text = 'SingleClick';
		} else if(code === 0x04) {
			text = 'DoubleClick';
		} else if(code === 0x07) {
			text = 'LongClick';
		} else if(code === 0x09) {
			text = 'LongClickRelease';
		} else if(code === 0x00) {
			text = 'Power';
		} else if(code === 0x01) {
			text = 'Return';
		} else if(code === 0x03) {
			text = 'Home';
		} else if(code === 0x05) {
			text = 'VolumeUp';
		} else if(code === 0x06) {
			text = 'VolumeDown';
		} else if(code === 0x08) {
			text = 'Pause';
		} else if(code === 0x0A) {
			text = 'FastForward';
		} else if(code === 0x0B) {
			text = 'ReWind';
		} else if(code === 0x0C) {
			text = 'Shutter';
		} else if(code === 0x0D) {
			text = 'Up';
		} else if(code === 0x0E) {
			text = 'Down';
		} else if(code === 0x0F) {
			text = 'Left';
		} else if(code === 0x10) {
			text = 'Right';
		} else if(code === 0x11) {
			text = 'Enter';
		} else if(code === 0x12) {
			text = 'Menu';
		} else if(code === 0x13) {
			text = 'Play';
		} else if(code === 0x14) {
			text = 'Stop';
		}

		res = {
			//name     : 'Pressed button information',
			name     : 'Pressed button',
			buttonId : code,
			buttonName: text
		};
	} else if(service_id === 6) {
		res = {
			//name   : 'Opening/closing sensor information',
			name   : 'Opening/closing',
			openingStatus : (n & 0b0000100000000000) ? true : false,
			openingCount  : (n & 0b0000011111111111)
		};
	} else if(service_id === 7) {
		res = {
			//name     : 'Human detection sensor information',
			name     : 'Human detection',
			humanDetectionResponse : (n & 0b0000100000000000) ? true : false,
			humanDetectionCount    : (n & 0b0000011111111111)
		};
	} else if(service_id === 8) {
		res = {
			//name     : 'Vibration Sensor Information',
			name     : 'Vibration',
			moveResponse : (n & 0b0000100000000000) ? true : false,
			moveCount    : (n & 0b0000011111111111)
		};
	}
	res['serviceId'] = service_id;
	return res;
};

module.exports = new LinkingAdvertising();