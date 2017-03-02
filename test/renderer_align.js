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

/* declaration of modules  */
var test = require('tap').test;
var tmp = require('tmp');

var assert = require('assert');
var path = require('path');
var fs = require('fs');
var local = path.join.bind(path, __dirname);

var Indigo = require("../indigo").Indigo;
var IndigoRenderer = require("../indigo_renderer");

var indigo = new Indigo();
var renderer = new IndigoRenderer(indigo);
var tmpDir = tmp.dirSync({ unsafeCleanup: true });

test('Align Atoms', function (t) {
    // console.log('\n#### - Align Atoms - ####\n');
    t.plan(3);
    var query = indigo.loadSmarts("[#7]1~[#6]~[#6]~[#7]~[#6]~[#6]2~[#6]~[#6]~[#6]~[#6]~[#6]~1~2");
    var sdfout;
    t.doesNotThrow(() => sdfout = indigo.writeFile(tmpDir + "/aligned.sdf"), Object);

    var xyz = [];
    var collection = indigo.createArray();
    var refatoms = [];

    t.doesNotThrow(() => {
        for (var structure of indigo.iterateSDFile(local("fixtures/benzodiazepine.sdf.gz"))) {
            var match = indigo.substructureMatcher(structure).match(query);
            if (!match) {
                // console.log("structure not matched, this is unexpected");
                return;
            }
            if (!structure.index()) {
                for (var atom of query.iterateAtoms()) {
                    xyz =xyz.concat(match.mapAtom(atom).xyz());
                }
            } else {
                var atoms = [];
                for (var atom of query.iterateAtoms()) {
                    atoms.push(match.mapAtom(atom).index());
                }
                var x = structure.alignAtoms(atoms, xyz);
                // console.log('%d', x);
            }
            structure.foldHydrogens();
            sdfout.sdfAppend(structure);
            structure.setProperty("title", "Molecule:" + structure.index() + "\nMass: " + structure.molecularWeight() + "\nFormula: " + structure.grossFormula());
            refatoms.push(match.mapAtom(query.getAtom(0)).index());
            collection.arrayAdd(structure);
            if (structure.index() == 15) break;
        }
    }, undefined);

    indigo.setOption("render-highlight-thickness-enabled", "true");
    indigo.setOption("render-image-size", "400, 400");
    indigo.setOption("render-grid-title-property", "PUBCHEM_COMPOUND_CID");
    indigo.setOption("render-grid-title-font-size", "10");
    indigo.setOption("render-grid-title-offset", "2");
    indigo.setOption("render-grid-title-alignment", "0.5");
    indigo.setOption("render-coloring", "true");

    t.doesNotThrow(() => {
        indigo.setOption("render-output-format", "svg");
        renderer.renderGridToFile(collection, null, 4, tmpDir.name + "/grid.svg");
        //	console.log(checkImageSimilarity('grid.svg'));
        indigo.setOption("render-output-format", "png");
        renderer.renderGridToFile(collection, null, 4, tmpDir.name + "/grid.png");
        //	console.log(checkImageSimilarity('grid.png'));
        indigo.setOption("render-output-format", "svg");
        renderer.renderGridToFile(collection, refatoms, 4, tmpDir.name + "/grid1.svg");
        //	console.log(checkImageSimilarity('grid1.svg'));
        indigo.setOption("render-output-format", "png");
        renderer.renderGridToFile(collection, refatoms, 4, tmpDir.name + "/grid1.png");
        //	console.log(checkImageSimilarity('grid1.png'));
    }, undefined, 'check render-output format');


    indigo.setOption("render-grid-title-property", "title");
    indigo.setOption("render-image-size", "-1, -1");
    indigo.setOption("render-bond-length", "30");
    indigo.setOption("render-output-format", "png");

    t.doesNotThrow(() => {
        var options_align = ["left", "right", "center", "center-left", "center-right"];
        for (var alignment of options_align) {
            indigo.setOption("render-grid-title-alignment", alignment);
            var fname = "grid-" + alignment + ".png";
            renderer.renderGridToFile(collection, null, 4, tmpDir.name + "/" + fname);
        }
    }, undefined, 'check render-grid');
});
