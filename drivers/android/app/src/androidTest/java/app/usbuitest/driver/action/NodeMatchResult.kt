package app.usbuitest.driver.action

import app.usbuitest.driver.data.hierarchy.AccNode

data class NodeMatchResult(
    var matchingNodes: List<AccNode>? = null,
    val matchingNode: AccNode? = null,
    val matchedProps: List<String> = mutableListOf(),
    val unmatchedProps: List<String> = mutableListOf()
)