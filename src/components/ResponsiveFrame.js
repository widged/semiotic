import React from "react"
import PropTypes from "prop-types"
import elementResizeEvent from "./vendor/element-resize-event"

const createResponsiveFrame = Frame =>
  class ResponsiveFrame extends React.Component {
    static propTypes = {
      size: PropTypes.array
    }

    static defaultProps = {
      size: [500, 500],
      debounce: 200
    }

    constructor(props) {
      super(props)

      this.state = {
        containerHeight: undefined,
        containerWidth: undefined
      }
    }

    isResizing = false

    _onResize = (width, height) => {
      this.setState({ containerHeight: height, containerWidth: width })
    }
    componentDidMount() {
      const element = this.node

      elementResizeEvent(element, () => {
        window.clearTimeout(this.isResizing)
        this.isResizing = setTimeout(() => {
          this.isResizing = false

          this.setState({
            containerHeight: element.offsetHeight,
            containerWidth: element.offsetWidth
          })
        }, this.props.debounce)
      })
      this.setState({
        containerHeight: element.offsetHeight,
        containerWidth: element.offsetWidth
      })
    }

    render() {
      const {
        responsiveWidth,
        responsiveHeight,
        size,
        dataVersion,
        debounce,
        ...rest
      } = this.props

      const { containerHeight, containerWidth } = this.state

      const actualSize = [...size]

      let returnEmpty = false

      if (responsiveWidth) {
        if (!containerWidth) returnEmpty = true
        actualSize[0] = containerWidth
      }

      if (responsiveHeight) {
        if (!containerHeight) returnEmpty = true
        actualSize[1] = containerHeight
      }

      const dataVersionWithSize = dataVersion + actualSize.toString() + debounce

      return (
        <div
          className="responsive-container"
          style={{ height: "100%", width: "100%" }}
          ref={node => (this.node = node)}
        >
          {!returnEmpty && (
            <Frame
              {...rest}
              size={actualSize}
              dataVersion={dataVersion ? dataVersionWithSize : undefined}
            />
          )}
        </div>
      )
    }
  }

export default createResponsiveFrame
