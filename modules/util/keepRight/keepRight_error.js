import { event as d3_event } from 'd3-selection';

import { t } from '../locale';
import { krError } from '../../osm';

import { errorTypes } from './errorSchema.json';

// TODO: remove these objects, here for reference
var keepRightSchema = {
        'schema': '',
        'id': 0,
        'error_type': 0,
        'error_name': 0,
        'object_type': [
            'node',
            'way',
            'relation'
        ],
        'object_id': 0,
        'state': [
            'new',
            'reopened',
            'ignore_temporarily',
            'ignore'
        ],
        'first_occurrence': new Date(),
        'last_checked': new Date(),
        'object_timestamp': new Date(),
        'user_name': '',
        'lat': 0,
        'lon': 0,
        'comment': '',
        'comment_timestamp': new Date(),
        'msgid': '',
        'txt1': '',
        'txt2': '',
        'txt3': '',
        'txt4': '',
        'txt5': ''
    };

var keepRightSchemaFromWeb = {
    'error_type': '192',
    'object_type': 'way',
    'object_id': '339948768',
    'comment': null,
    'error_id': '92854860',
    'schema': '58',
    'description': 'This waterway intersects the highway #450282565',
    'title': 'intersections without junctions, highway-waterway'
};

// TODO: clean up description parsing some: remove or ignore spurious characters
export function parseErrorDescriptions(entity) {
    if (!(entity instanceof krError)) return;

    // find the matching template from the error schema
    var errorType = '_' + entity.error_type;
    var matchingTemplate = errorTypes.errors[errorType] || errorTypes.warnings[errorType];
    if (!matchingTemplate) return;

    // tokenize descriptions
    var errorDescriptions = entity.description.split(' ');
    var templateDescriptions = matchingTemplate.description.split(' ');

    var parsedDescriptions = [];
    var re = new RegExp(/{\$[0-9]}/);

    var commonEntities = ['node', 'way', 'relation', 'highway', 'cycleway', 'waterway', 'riverbank']; // TODO: expand this list, or implement a different translation function

    function fillPlaceholder(d) {
        return '<span><a class="kr_error_description-id">' + d + '</a></span>';
    }

    function getEntityBase(lastWord) {
        var result;
        commonEntities.forEach(function(entity) {
            if (entity.includes(lastWord)) { result = entity; }
            return;
        });

        if (result) {
            result = result.includes('node') ? 'n' : result.includes('way') ? 'w' : result.includes('relation') ? 'r' : null;
        }
        return result;
    }

    templateDescriptions.forEach(function(word, index) {
        if (!re.test(word)) return;

        // get the word at this index, and at the next index value
        var nextWord = templateDescriptions[index + 1] ? templateDescriptions[index + 1] : null;

        var parsedPhrase = '';

        // parse error description words
        for (var i = index; i <= errorDescriptions.length - 1;  i++) {
            if (errorDescriptions[i] !== nextWord) {
                var currWord = errorDescriptions[i];

                // strip leading # if present
                if (currWord.charAt(0) === '#') {
                    currWord = currWord.slice(1, currWord.length);

                    // get the entity type of the id
                    var lastWord = errorDescriptions[i-1];
                    var base;
                    if (lastWord) { base = getEntityBase(lastWord); }
                    if (!base) {
                        base = getEntityBase(parsedDescriptions.slice(-1)[0].split(' ').slice(-1)[0]);
                    }

                    // wrap id with linking span
                    currWord = fillPlaceholder(base + currWord);
                }

                // if any variables contain common words, like node, way, relation, translate those
                if (commonEntities.includes(currWord)) {
                    currWord = t('QA.keepRight.entities.' + currWord);
                }

                parsedPhrase += currWord;
            }
            // add phrase (or single word) to variable list
            parsedDescriptions.push(parsedPhrase);
            break;
        }
    });


    return {
        var1: parsedDescriptions[0] || '',
        var2: parsedDescriptions[1] || '',
        var3: parsedDescriptions[2] || '',
        var4: parsedDescriptions[3] || '',
        var5: parsedDescriptions[4] || '',
        var6: parsedDescriptions[5] || '',
    };
}


export function clickLink(context, id) {
        d3_event.preventDefault();
        context.layers().layer('osm').enabled(true);
        context.zoomToEntity(id);
    }