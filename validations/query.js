var validateAttributeValue = require('./index').validateAttributeValue

exports.types = {
  Limit: {
    type: 'Integer',
    greaterThanOrEqual: 1,
    lessThanOrEqual: 100,
  },
  ExclusiveStartKey: {
    type: 'Map',
    children: {
      type: 'Structure',
      children: {
        S: 'String',
        B: 'Blob',
        N: 'String',
        BS: {
          type: 'List',
          children: 'Blob',
        },
        NS: {
          type: 'List',
          children: 'String',
        },
        SS: {
          type: 'List',
          children: 'String',
        }
      }
    }
  },
  KeyConditions: {
    type: 'Map',
    children: {
      type: 'Structure',
      children: {
        AttributeValueList: {
          type: 'List',
          children: {
            type: 'Structure',
            children: {
              S: 'String',
              B: 'Blob',
              N: 'String',
              BS: {
                type: 'List',
                children: 'Blob',
              },
              NS: {
                type: 'List',
                children: 'String',
              },
              SS: {
                type: 'List',
                children: 'String',
              }
            }
          }
        },
        ComparisonOperator: {
          type: 'String',
          notNull: true,
          enum: ['IN', 'NULL', 'BETWEEN', 'LT', 'NOT_CONTAINS', 'EQ', 'GT', 'NOT_NULL', 'NE', 'LE', 'BEGINS_WITH', 'GE', 'CONTAINS']
        }
      }
    }
  },
  ReturnConsumedCapacity: {
    type: 'String',
    enum: ['TOTAL', 'NONE']
  },
  AttributesToGet: {
    type: 'List',
    lengthGreaterThanOrEqual: 1,
    lengthLessThanOrEqual: 255,
  },
  TableName: {
    type: 'String',
    required: true,
    tableName: true,
    regex: '[a-zA-Z0-9_.-]+',
  },
  Select: {
    type: 'String',
    enum: ['SPECIFIC_ATTRIBUTES', 'COUNT', 'ALL_ATTRIBUTES', 'ALL_PROJECTED_ATTRIBUTES']
  },
  ConsistentRead: 'Boolean',
  IndexName: {
    type: 'String',
    tableName: true,
    regex: '[a-zA-Z0-9_.-]+',
  },
  ScanIndexForward: 'Boolean',
}

exports.custom = function(data) {
  if (!data.KeyConditions)
    return 'Conditions must not be null'
  var conditionKeys = Object.keys(data.KeyConditions)

  var msg = ''
  var lengths = {
    NULL: 0,
    NOT_NULL: 0,
    EQ: 1,
    NE: 1,
    LE: 1,
    LT: 1,
    GE: 1,
    GT: 1,
    CONTAINS: 1,
    NOT_CONTAINS: 1,
    BEGINS_WITH: 1,
    IN: [1],
    BETWEEN: 2,
  }
  for (var key in data.KeyConditions) {
    var comparisonOperator = data.KeyConditions[key].ComparisonOperator
    var attrValList = data.KeyConditions[key].AttributeValueList || []
    for (var i = 0; i < attrValList.length; i++) {
      msg = validateAttributeValue(attrValList[i])
      if (msg) return msg
    }
    if ((typeof lengths[comparisonOperator] == 'number' && attrValList.length != lengths[comparisonOperator]) ||
        (attrValList.length < lengths[comparisonOperator][0] || attrValList.length > lengths[comparisonOperator][1]))
      return 'The attempted filter operation is not supported for the provided filter argument count'
  }

  if (conditionKeys.length != 1 && conditionKeys.length != 2) {
    return 'Conditions can be of length 1 or 2 only'
  }

  if (data.ExclusiveStartKey) {
    for (key in data.ExclusiveStartKey) {
      msg = validateAttributeValue(data.ExclusiveStartKey[key])
      if (msg) return 'The provided starting key is invalid: ' + msg
    }
  }

  // TODO: Actually need to pull the table out for these
  for (var key in data.KeyConditions) {
    var comparisonOperator = data.KeyConditions[key].ComparisonOperator
    if (~['NULL', 'NOT_NULL', 'CONTAINS', 'NOT_CONTAINS', 'IN'].indexOf(comparisonOperator))
      return 'Query can be performed only on a table with a HASH,RANGE key schema'
  }

  var firstKey = Object.keys(data.KeyConditions)[0]
  var comparisonOperator = data.KeyConditions[firstKey].ComparisonOperator
  if (~['LE', 'LT', 'GE', 'GT', 'BEGINS_WITH', 'BETWEEN'].indexOf(comparisonOperator))
    return 'Query can be performed only on a table with a HASH,RANGE key schema'
}

