import React from 'react';


export default class Loader extends React.Component {
    constructor(props) {
        super(props);
        const {requests} = props;
        const resolved = requests.filter(request => request.status !== 'pending');
        this.state = {
            curPerc: requests.length ? resolved.length / requests.length : 1
        };
        this.startLoop();
    }

    inchTheLoadingBarLoop() {
        const {requests} = this.props;
        const resolved = requests.filter(request => request.status !== 'pending');

        if (resolved.length === requests.length) {
            return;
        }

        const nextPerc = (resolved.length + 1) / requests.length;
        const delta = nextPerc - this.state.curPerc;
        const percMove = Math.random() * 0.15 + 0.1; // 10-25% of the delta
        this.setState({
            curPerc: this.state.curPerc + percMove * delta
        }, () => this.startLoop());
    }

    startLoop() {
        const delay = parseInt(Math.random() * 500 + 750, 10); // 750-1250ms
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => this.inchTheLoadingBarLoop(), delay);
    }

    componentWillReceiveProps({requests}) {
        const resolved = requests.filter(request => request.status !== 'pending');
        this.setState({
            curPerc: requests.length ? resolved.length / requests.length : 1
        }, () => this.startLoop());
    }

    render() {
        return (
            <div>{this.state.curPerc * 100 | 0}%</div>
        );
    }
}

Loader.propTypes = {
    requests: React.PropTypes.array.isRequired
};
