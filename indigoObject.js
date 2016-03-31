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

IndigoObject = function (d, id, parent) {
	this.id = id;
	this.d = d;
	this.parent = parent;
}

/*
 * Free an object
 * 
 * @method dispose
 */
IndigoObject.prototype.dispose = function () {
	if (this.id >= 0)
		if (this.d._sid >= 0 && this.d._lib != null) {
			this.d._setSessionId();
			this.d._lib.indigoFree(this.id);
		}
	this.id = -1;
}

/*
 * Clone an object
 * 
 * @method clone
 */
IndigoObject.prototype.clone = function () {
	this.d._setSessionId();
	return new IndigoObject(this.d, this.d._checkResult(this.d._lib.indigoClone(this.id)));
}

module.exports = IndigoObject;
