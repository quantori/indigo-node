/****************************************************************************
 * Copyright (C) 2015-2016 EPAM Systems
 * 
 * This file is part of Indigo-Node binding.
 * 
 * This file may be distributed and/or modified under the terms of the
 * GNU General Public License version 3 as published by the Free Software
 * Foundation and appearing in the file LICENSE.md  included in the
 * packaging of this file.
 * 
 * This file is provided AS IS with NO WARRANTY OF ANY KIND, INCLUDING THE
 * WARRANTY OF DESIGN, MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.
 ***************************************************************************/
var path = require('path');
var local = path.join.bind(path, __dirname);
var config = require(local('configureIndigo'));
var lib_api = require(local('indigo-api'));
var IndigoObject = require(local('indigoObject'));
var ffi = require('ffi');

var Indigo = function (options) {
	options = options || {};
	var libpath = local('shared/' + process.platform + '/' + process.arch + '/'+ config[process.platform].libs['indigo']);
	this.libpath = options.libpath || libpath;
	this.logger = options.logger || console;
	this._lib = ffi.Library(libpath, lib_api.api);
	// Allocate a new session. Each session has its own
	// set of objects created and options set up.
	this._sid = this._lib.indigoAllocSessionId();
	this._out = lib_api.out;
	this._type = lib_api.type;
};

/*
 * Return Indigo version string.
 * 
 * @method getVersion
 * @return {String} Indigo version
 */
Indigo.prototype.getVersion = function () {
	return "Indigo version(" + this._lib.indigoVersion() + ");";
};

/* System */

/*
 * Switch to another session. The session, if was not allocated
 * previously, is allocated automatically and initialized with
 * empty set of objects and default options.
 * 
 * @method _setSessionId
 */
Indigo.prototype._setSessionId = function () {
	this._lib.indigoSetSessionId(this._sid)
};

/*
 * Release session. The memory used by the released session
 * is not freed, but the number will be reused on
 * further allocations.
 * 
 * @method _releaseSessionId
 */
Indigo.prototype._releaseSessionId = function () {
	if (this._lib)
		this._lib.indigoReleaseSessionId(this._sid);
};

/*
 * Get the last error message
 * 
 * @method getLastError
 */
Indigo.prototype.getLastError = function () {
	if (this._lib)
		return this._lib.indigoGetLastError();
	return '';
};

/*
 * Check result
 * 
 * @method _checkResult
 * @param {number} result
 */
Indigo.prototype._checkResult = function (result) {
	if (result < 0) {
		var msg = this.getLastError();
		this.logger.error('res < 0[' + result + ']: ' + msg);
	}
	return result;
};

/*
 * Check string result 
 * 
 * @method _checkResultString
 * @param {string} result
 */
Indigo.prototype._checkResultString = function (result) {
	if (typeof result !== 'string')
		this.logger.error("the result isn't string");
	return result;
};

/*
 * Count object currently allocated
 * 
 * @method countReferences
 * @return {number} count
 */
Indigo.prototype.countReferences = function () {
	this._setSessionId();
	return this._checkResult(this._lib.indigoCountReferences());
};

/*
 * Load molecule from string 
 * 
 * @method loadMolecule
 * @param {string} string reprsantation of molecule or a specification in form of a line notation for describing the structure of chemical species using short ASCII strings.
 * @return {object} IndigoObject
 */
Indigo.prototype.loadMolecule = function (string) {
	this._setSessionId();
	return new IndigoObject(this, this._checkResult(this._lib.indigoLoadMoleculeFromString(string)));
};

/*
 * Load query molecule from string 
 * 
 * @method loadQueryMolecule
 * @param {string} string reprsantation of query molecule or a specification in form of a line notation for describing the structure of chemical species using short ASCII strings.
 * @return {object} IndigoObject
 */
Indigo.prototype.loadQueryMolecule = function (string) {
	this._setSessionId();
	return new IndigoObject(this, this._checkResult(this._lib.indigoLoadQueryMoleculeFromString(string)));
};

/*
 * Load query molecule from file 
 * 
 * @method loadQueryMoleculeFromFile
 * @param {string} filename of chemical format of molecule.
 * @return {object} IndigoObject
 */
Indigo.prototype.loadQueryMoleculeFromFile = function (filename) {
	this._setSessionId();
	return new IndigoObject(this, this._checkResult(this._lib.indigoLoadQueryMoleculeFromFile(filename)));
};

/*
 * Load molecule from file 
 * 
 * @method loadMoleculeFromFile
 * @param {string} filename of chemical format of molecule.
 * @return {object} IndigoObject
 */
Indigo.prototype.loadMoleculeFromFile = function (filename) {
	this._setSessionId();
	return new IndigoObject(this, this._checkResult(this._lib.indigoLoadMoleculeFromFile(filename)));
};

/*
 * Load molecular pattern from SMARTS string format
 * 
 * @method loadSmarts
 * @param {string} a particular pattern (subgraph) in a molecule (graph)
 * @return {object} IndigoObject
 */
Indigo.prototype.loadSmarts = function (string) {
	this._setSessionId();
	return new IndigoObject(this, this._checkResult(this._lib.indigoLoadSmartsFromString(string)));
}

/*
 * Load molecular pattern from file which contains SMARTS string format
 * 
 * @method loadSmartsFromFile
 * @param {string} a particular pattern (subgraph) in a molecule (graph)
 * @return {object} IndigoObject
 */
Indigo.prototype.loadSmartsFromFile = function (filename) {
	this._setSessionId();
	return new IndigoObject(this, this._checkResult(this._lib.indigoLoadSmartsFromFile(filename)));
}

/*
 *  Substructure matching 
 *  
 * @method substructureMatcher
 * @param {object} target is IndigoObject
 * @param {string} 'mode' is reserved for future use; currently its value is ignored
 * @return {object} a new 'matcher' object
 */
Indigo.prototype.substructureMatcher = function (target, mode) {
	this._setSessionId();
	if (mode === undefined || mode === null) {
		mode = '';
	}
	return new IndigoObject(this, this._checkResult(this._lib.indigoSubstructureMatcher(target.id, mode)), target);
};

/*
 * 
 * 
 * @method unserialize
 * @param {array} 
 * @return {object} a new indigo object
 */
Indigo.prototype.unserialize = function (array) {
	this._setSessionId();
	var buf = new Buffer(array);
	var pointer = this._out.alloc(this._type.byte_ptr, buf);
	var res = this._lib.indigoUnserialize(pointer.deref(), buf.length);
	return new IndigoObject(this, this._checkResult(res));
};

/*
 * 
 * 
 * @method writeBuffer
 * @return {object} a new indigo object
 */
Indigo.prototype.writeBuffer = function () {
	this._setSessionId();
	var id = this._checkResult(this._lib.indigoWriteBuffer());
	return new IndigoObject(this, id);
}

/*
 * 
 * 
 * @method createSaver
 * @param {object} 
 * @param {string} format
 * @return {object} a new indigo object
 */
Indigo.prototype.createSaver = function (obj, format) {
	this._setSessionId();
	return new IndigoObject(this, this._checkResult(this._lib.indigoCreateSaver(obj.id, format)));
}

/*
 * Set Option 
 * 
 * @method setOption
 * @param {string} name of option.
 * @param {number or string or boolean} value of option.
 * @return {boolean} return true if option applies as successful
 */
Indigo.prototype.setOption = function (option, value1, value2, value3) {
	this._setSessionId();
	var ret = -1;
	var value2 = value2 || 0;
	var value3 = value3 || 0;
	if (!value2) {
		switch (typeof value1) {
			case 'string':
				ret = this._checkResult(this._lib.indigoSetOption(option, value1));
				break;
			case 'number':
				{
					if (/^[0-9]+$/.test(String(value1)))
						ret = this._checkResult(this._lib.indigoSetOptionInt(option, value1));
					else
						ret = this._checkResult(this._lib.indigoSetOptionFloat(option, value1));
				}
				break;
			case 'boolean':
				var value1_b = (value1)?1:0;
				ret = this._checkResult(this._lib.indigoSetOptionBool(option, value1_b));
				break;
			default:
				this.logger.error("bad option");
		}
	}
	else {
		if (typeof value1 === 'number' && typeof value2 === 'number') {
			if ((/^[0-9]+$/.test(String(value1))) && (/^[0-9]+$/.test(String(value2))))
				ret = this._checkResult(this._lib.indigoSetOptionXY(option, value1, value2));
			else
				this.logger.error("bad option");
		}
		if (typeof value1 === 'number' && typeof value2 === 'number' && typeof value3 === 'number') {
			if (!(/^[0-9]+$/.test(String(value1))) && !(/^[0-9]+$/.test(String(value2))) && !(/^[0-9]+$/.test(String(value3))))
				ret = this._checkResult(this._lib.indigoSetOptionColor(option, value1, value2, value3));
			else
				this.logger.error("bad option");
		}
	}
	return (ret === 1);
};

module.exports = new Indigo();
